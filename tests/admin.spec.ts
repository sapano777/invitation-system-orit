import { expect, test } from "@playwright/test";
import { login, randomPhone, SLUG_PREFIX, state } from "./helpers";

test("admin pages require login", async ({ page }) => {
  await page.goto(`/admin/events/${state().events[`${SLUG_PREFIX}admin`]}`);
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("wrong password", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "e2e-staff@example.com");
  await page.fill("#password", "wrong-password");
  await page.getByRole("button", { name: "כניסה" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("האימייל או הסיסמה שגויים.");
});

test.describe("signed in", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`/admin/events/${state().events[`${SLUG_PREFIX}admin`]}`);
  });

  test("add, find, cancel and delete a registration", async ({ page }) => {
    const name = `אורח ${Math.floor(Math.random() * 1e6)}`;
    await page.getByRole("button", { name: "הוספת נרשם" }).click();
    const dialog = page.locator("dialog[open]");
    await dialog.locator("#reg-full_name").fill(name);
    await dialog.locator("#reg-phone").fill(randomPhone());
    await dialog.locator("#reg-guest_count").fill("2");
    await dialog.getByRole("button", { name: "שמירה" }).click();
    await expect(dialog).toHaveCount(0);

    const item = page.locator("main li", { hasText: name });
    await expect(item).toContainText("2 מגיעים");

    await page.getByRole("searchbox").fill(name);
    await expect(page.locator("main li")).toHaveCount(1);

    await expect(item.getByRole("link", { name: "וואטסאפ" })).toHaveAttribute("href", /^https:\/\/wa\.me\/9725\d{8}\?text=/);

    await item.getByRole("button", { name: "עריכה" }).click();
    await page.locator("dialog[open] #reg-status").selectOption("cancelled");
    await page.locator("dialog[open]").getByRole("button", { name: "שמירה" }).click();
    await expect(page.locator("main li", { hasText: name })).toHaveCount(0);

    await page.getByLabel("סטטוס").selectOption("cancelled");
    page.once("dialog", (d) => d.accept());
    await page.locator("main li", { hasText: name }).getByRole("button", { name: "מחיקה" }).click();
    await expect(page.locator("main li", { hasText: name })).toHaveCount(0);
  });

  test("export to Excel", async ({ page }) => {
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "ייצוא ל-Excel" }).click()]);
    expect(download.suggestedFilename()).toMatch(/^registrations-e2e-admin-\d{4}-\d{2}-\d{2}\.xlsx$/);
  });

  test("preview shows the invitation with a disabled form", async ({ page }) => {
    await page.getByRole("link", { name: "תצוגה מקדימה" }).click();
    await expect(page.getByText("תצוגה מקדימה", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("בדיקת ניהול");
    await expect(page.getByRole("button", { name: "אישור הגעה" })).toBeDisabled();
    await page.getByRole("link", { name: "חזרה לאירוע" }).click();
    await expect(page).toHaveURL(/\/admin\/events\/[0-9a-f-]{36}$/);
  });
});
