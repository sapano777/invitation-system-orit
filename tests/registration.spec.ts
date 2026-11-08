import { expect, test } from "@playwright/test";
import { adminClient, randomPhone, SLUG_PREFIX, state, toInternational, useRandomIp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await useRandomIp(page);
});

test("validation errors keep what was typed", async ({ page }) => {
  await page.goto(`/e/${SLUG_PREFIX}classic`);
  await page.fill("#full_name", "רונית");
  await page.fill("#phone", "123");
  await page.fill("#email", "not-an-email");
  await page.getByRole("button", { name: "אישור הגעה" }).click();

  await expect(page.locator("#phone-error")).toHaveText("מספר טלפון לא תקין");
  await expect(page.locator("#email-error")).toHaveText("כתובת אימייל לא תקינה");
  await expect(page.locator("#full_name")).toHaveValue("רונית");
});

test("register, then register again with the same phone to update", async ({ page }) => {
  const phone = randomPhone();
  await page.goto(`/e/${SLUG_PREFIX}classic`);

  await page.fill("#full_name", "דנה בדיקה");
  await page.fill("#phone", phone);
  await page.fill("#email", "Dana@Example.com");
  await page.selectOption("#guest_count", "3");
  await expect(page.locator('input[name="guest_names"]').first()).toHaveValue("דנה בדיקה");
  await page.locator('input[name="guest_names"]').nth(1).fill("יוסי בדיקה");
  await page.fill("#notes", "צמחונית");
  await page.getByRole("button", { name: "אישור הגעה" }).click();
  await expect(page.getByRole("status")).toContainText("נרשמתם לאירוע, 3 מגיעים");

  // "Change registration" reopens the form with what was submitted.
  await page.getByRole("button", { name: "שינוי ההרשמה" }).click();
  await expect(page.locator("#email")).toHaveValue("Dana@Example.com");
  await expect(page.locator("#guest_count")).toHaveValue("3");

  // Same phone typed differently updates the same registration.
  await page.fill("#full_name", "דנה בדיקה-לוי");
  await page.fill("#phone", `+972 ${phone.slice(1)}`);
  await page.selectOption("#guest_count", "2");
  await page.getByRole("button", { name: "אישור הגעה" }).click();
  await expect(page.getByRole("status")).toContainText("ההרשמה עודכנה, 2 מגיעים");

  const { data } = await adminClient()
    .from("registrations")
    .select("full_name, email, guest_count, guest_names, notes, locale")
    .eq("event_id", state().events[`${SLUG_PREFIX}classic`])
    .eq("phone", toInternational(phone));
  expect(data).toHaveLength(1);
  expect(data![0]).toMatchObject({ full_name: "דנה בדיקה-לוי", email: "dana@example.com", guest_count: 2, locale: "he" });
});

test("registering again without an email keeps the earlier one", async ({ page }) => {
  const phone = randomPhone();
  for (const email of ["keep@example.com", ""]) {
    await page.goto(`/e/${SLUG_PREFIX}floral`);
    await page.fill("#full_name", "שומרת אימייל");
    await page.fill("#phone", phone);
    await page.fill("#email", email);
    await page.getByRole("button", { name: "אישור הגעה" }).click();
    await expect(page.getByRole("status")).toBeVisible();
  }
  const { data } = await adminClient().from("registrations").select("email").eq("phone", toInternational(phone)).single();
  expect(data?.email).toBe("keep@example.com");
});

test("a full event doesn't take registrations", async ({ page }) => {
  await page.goto(`/e/${SLUG_PREFIX}full`);
  await expect(page.getByText("כל המקומות לאירוע תפוסים.")).toBeVisible();
  await expect(page.getByRole("button", { name: "אישור הגעה" })).toHaveCount(0);
});

test("an inactive event doesn't take registrations", async ({ page }) => {
  await page.goto(`/e/${SLUG_PREFIX}closed`);
  await expect(page.getByText("ההרשמה לאירוע הזה סגורה.")).toBeVisible();
});

test("bots filling the hidden field are ignored", async ({ page }) => {
  const phone = randomPhone();
  await page.goto(`/e/${SLUG_PREFIX}minimal`);
  await page.fill("#full_name", "Bot");
  await page.fill("#phone", phone);
  await page.locator('input[name="website"]').evaluate((el: HTMLInputElement) => (el.value = "http://spam.example"));
  await page.getByRole("button", { name: "אישור הגעה" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  const { count } = await adminClient()
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("phone", toInternational(phone));
  expect(count).toBe(0);
});
