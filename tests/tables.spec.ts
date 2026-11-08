import ExcelJS from "exceljs";
import { expect, test, type Page } from "@playwright/test";
import { login, SLUG_PREFIX, state } from "./helpers";

const summary = (page: Page, label: string) => page.locator("dl > div", { hasText: label }).locator("dd");
const table = (page: Page, name: string) => page.getByRole("region", { name, exact: true });
const unseated = (page: Page) => page.getByRole("region", { name: "לא הושבו", exact: true });

test("seat guests, edit tables, export", async ({ page }, testInfo) => {
  const eventId = state().events[`${SLUG_PREFIX}seating-${testInfo.project.name}`];
  await login(page);
  await page.goto(`/admin/events/${eventId}/tables`);

  // Confirmed guests only: 4 + 3 + 2 + 1.
  await expect(summary(page, "מגיעים שהושבו")).toHaveText("0 / 10");
  await expect(unseated(page).locator("li")).toHaveCount(4);
  await expect(page.getByText("ביטלו")).toHaveCount(0);

  await page.getByLabel("מספר שולחנות").fill("2");
  await page.getByLabel("מקומות בכל שולחן").fill("5");
  await page.getByRole("button", { name: "הוספת שולחנות" }).click();
  await expect(table(page, "שולחן 1")).toBeVisible();
  await expect(table(page, "שולחן 2")).toBeVisible();
  await expect(summary(page, "סה\"כ מקומות")).toHaveText("10");

  // Seat with the per-guest menu (works on touch screens too).
  await page.getByLabel("שולחן עבור משפחת כהן").selectOption({ label: "שולחן 1" });
  await expect(table(page, "שולחן 1")).toContainText("משפחת כהן");
  await expect(table(page, "שולחן 1")).toContainText("4/5");
  await expect(summary(page, "מגיעים שהושבו")).toHaveText("4 / 10");

  // Drag and drop on desktop; the menu elsewhere.
  if (testInfo.project.name === "desktop") {
    // Grab the name row, as a person would (the menu below it isn't a drag handle).
    await page.locator('[data-guest="משפחת לוי"] > div').dragTo(table(page, "שולחן 2"));
  } else {
    await page.getByLabel("שולחן עבור משפחת לוי").selectOption({ label: "שולחן 2" });
  }
  await expect(table(page, "שולחן 2")).toContainText("משפחת לוי");

  // Over capacity is allowed but flagged.
  await page.getByLabel("שולחן עבור זוג מזרחי").selectOption({ label: "שולחן 1" });
  await expect(table(page, "שולחן 1")).toContainText("חריגה במקום אחד");

  // Saved on the server.
  await expect(page.getByRole("status")).toHaveText("כל השינויים נשמרו.");
  await page.reload();
  await expect(table(page, "שולחן 1")).toContainText("6/5");
  await expect(summary(page, "מגיעים שהושבו")).toHaveText("9 / 10");

  // Rename and resize table 2.
  await table(page, "שולחן 2").getByRole("button", { name: "עריכה" }).click();
  await table(page, "שולחן 2").getByRole("textbox", { name: "שם", exact: true }).fill("שולחן משפחה");
  await table(page, "שולחן 2").getByRole("spinbutton", { name: "מקומות", exact: true }).fill("8");
  await table(page, "שולחן 2").getByRole("button", { name: "שמירה" }).click();
  await expect(table(page, "שולחן משפחה")).toContainText("3/8");

  // Deleting a table sends its guests back to "not seated".
  page.once("dialog", (d) => d.accept());
  await table(page, "שולחן 1").getByRole("button", { name: "מחיקה" }).click();
  await expect(table(page, "שולחן 1")).toHaveCount(0);
  await expect(unseated(page)).toContainText("משפחת כהן");
  await expect(summary(page, "מגיעים שהושבו")).toHaveText("3 / 10");

  // The export has a table column and a seating sheet.
  await page.goto(`/admin/events/${eventId}`);
  await expect(page.locator("main li", { hasText: "משפחת לוי" })).toContainText("שולחן משפחה");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "ייצוא ל-Excel" }).click()]);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(await download.path());

  const sheet = workbook.getWorksheet("נרשמים")!;
  const header = (sheet.getRow(1).values as string[]).slice(1);
  const tableColumn = header.indexOf("שולחן") + 1;
  expect(tableColumn).toBeGreaterThan(0);
  const levi = sheet.getRows(2, sheet.rowCount - 1)!.find((row) => row.getCell(1).value === "משפחת לוי")!;
  expect(levi.getCell(tableColumn).value).toBe("שולחן משפחה");

  const seatingSheet = workbook.getWorksheet("סידור שולחנות")!;
  const rows = seatingSheet.getRows(2, seatingSheet.rowCount - 1)!.map((row) => (row.values as unknown[]).slice(1));
  expect(rows).toContainEqual(["שולחן משפחה", 8, 3, "משפחת לוי (3)"]);
  expect(rows.find((r) => r[0] === "לא הושבו")?.[2]).toBe(7);
});
