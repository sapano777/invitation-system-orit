import ExcelJS from "exceljs";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { getAuthState } from "@/lib/auth";
import { getEvent, getRegistrations, summarize } from "@/lib/events/queries";
import { formatPhone } from "@/lib/phone";
import { guestNamesList } from "@/lib/registration/guest-names";

// Excel export of all registrations (confirmed and cancelled) for one event.
export async function GET(_request: Request, { params }: RouteContext<"/admin/events/[id]/export">) {
  // Route handlers don't go through the admin layout, so check here too.
  const auth = await getAuthState();
  if (auth.status !== "staff") return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return new Response("Not found", { status: 404 });

  const [registrations, t, format, locale] = await Promise.all([
    getRegistrations(event.id),
    getTranslations(),
    getFormatter(),
    getLocale(),
  ]);
  const rtl = locale === "he";
  const dateTime = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "short", timeStyle: "short" });

  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(t("export.sheetName"), {
    views: [{ state: "frozen", ySplit: 1, rightToLeft: rtl }],
  });
  sheet.columns = [
    { header: t("export.columns.full_name"), key: "full_name", width: 24 },
    { header: t("export.columns.phone"), key: "phone", width: 16 },
    { header: t("export.columns.email"), key: "email", width: 28 },
    { header: t("export.columns.guest_count"), key: "guest_count", width: 12 },
    { header: t("export.columns.guest_names"), key: "guest_names", width: 40 },
    { header: t("export.columns.notes"), key: "notes", width: 36 },
    { header: t("export.columns.status"), key: "status", width: 12 },
    { header: t("export.columns.source"), key: "source", width: 16 },
    { header: t("export.columns.created_at"), key: "created_at", width: 18 },
    { header: t("export.columns.updated_at"), key: "updated_at", width: 18 },
  ];

  // Oldest first reads better in a spreadsheet.
  for (const r of [...registrations].reverse()) {
    sheet.addRow({
      full_name: r.full_name,
      phone: formatPhone(r.phone),
      email: r.email ?? "",
      guest_count: r.guest_count,
      guest_names: guestNamesList(r.guest_names).join(", "),
      notes: r.notes ?? "",
      status: t(`registrations.status.${r.status}`),
      source: t(`registrations.source.${r.source}`),
      created_at: dateTime(r.created_at),
      updated_at: dateTime(r.updated_at),
    });
  }

  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1EFEC" } };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
  sheet.getColumn("notes").alignment = { wrapText: true, vertical: "top" };
  sheet.getColumn("guest_names").alignment = { wrapText: true, vertical: "top" };

  const summary = summarize(registrations);
  const summarySheet = workbook.addWorksheet(t("export.summarySheet"), { views: [{ rightToLeft: rtl }] });
  summarySheet.columns = [{ width: 22 }, { width: 40 }];
  summarySheet.addRows([
    [t("export.summary.event"), event.title],
    [t("export.summary.date"), format.dateTime(new Date(event.date_time), { dateStyle: "full", timeStyle: "short" })],
    [t("eventPage.summary.registrations"), summary.registrations],
    [t("eventPage.summary.guests"), summary.guests],
    [t("eventPage.summary.withEmail"), summary.withEmail],
    [t("eventPage.summary.cancelled"), summary.cancelled],
    [t("export.summary.exportedAt"), format.dateTime(new Date(), { dateStyle: "short", timeStyle: "short" })],
  ]);
  summarySheet.getColumn(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  // ASCII only: with a Hebrew filename* some Chromium builds ignore the name
  // altogether and save the file as "download".
  const filename = `registrations-${event.slug}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
