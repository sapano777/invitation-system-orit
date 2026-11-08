import { expect, test } from "@playwright/test";
import { SLUG_PREFIX } from "./helpers";

const TEMPLATES = ["classic", "minimal", "floral", "midnight", "gold", "kids", "corporate", "tech", "festive", "romantic"];

test.describe("invitation page", () => {
  for (const template of TEMPLATES) {
    test(`${template} renders and fits the screen`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));

      await page.goto(`/e/${SLUG_PREFIX}${template}`);
      await expect(page.locator(`[data-template="${template}"]`)).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(`בדיקה ${template}`);
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.getByRole("link", { name: "ניווט ב-Waze" })).toHaveAttribute("href", /waze\.com\/ul\?ll=32\.07551,34\.77554/);
      await expect(page.getByRole("link", { name: "מתנה / תשלום" })).toHaveAttribute("href", "https://example.com/gift");
      await expect(page.getByRole("button", { name: "אישור הגעה" })).toBeEnabled();
      // Countdown fills in on the client.
      await expect(page.getByRole("timer")).not.toContainText("–");

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "no horizontal scrolling").toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test("calendar file", async ({ request }) => {
    const res = await request.get(`/e/${SLUG_PREFIX}classic/calendar.ics`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/calendar");
    const body = await res.text();
    expect(body).toContain("BEGIN:VEVENT");
    expect(body).toContain("SUMMARY:בדיקה classic");
  });

  test("unknown link shows not found", async ({ page }) => {
    const res = await page.goto("/e/no-such-event-here");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "ההזמנה לא נמצאה" })).toBeVisible();
  });

  test("switching to English", async ({ page }) => {
    await page.goto(`/e/${SLUG_PREFIX}corporate`);
    await page.getByRole("button", { name: "English" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("button", { name: "Confirm attendance" })).toBeVisible();
  });
});
