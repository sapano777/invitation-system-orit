import "server-only";
import { createTranslator } from "next-intl";
import en from "../../../messages/en.json";
import he from "../../../messages/he.json";
import { googleCalendarUrl } from "@/lib/calendar";
import { TIME_ZONE } from "@/lib/dates";
import { readableOn } from "@/lib/color";
import { googleMapsUrl, wazeUrl } from "@/lib/navigation";
import { publicEventPath } from "@/lib/site";
import type { EventRow } from "@/lib/types/database";
import { isTemplateId, templates } from "@/templates/registry";
import type { OutgoingEmail } from "./transport";

type Locale = "he" | "en";

export type ReminderEvent = Pick<
  EventRow,
  "id" | "slug" | "title" | "description" | "date_time" | "venue_name" | "address" | "lat" | "lng" | "template_id" | "primary_color" | "updated_at"
>;

type Recipient = { email: string; full_name: string; guest_count: number; locale: Locale };

const messages = { he, en };

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// The reminder email: event details, links to the invitation, navigation and
// calendar. Table-based inline-styled HTML, which is what email clients
// render reliably, plus a plain-text version.
export function buildReminderEmail(event: ReminderEvent, to: Recipient, siteUrl: string, options: { test?: boolean } = {}): OutgoingEmail {
  const locale = to.locale;
  const t = createTranslator({ locale, messages: messages[locale], namespace: "email.reminder" });
  const rtl = locale === "he";
  const date = new Date(event.date_time);
  const intlLocale = rtl ? "he-IL" : "en-GB";
  const dateText = new Intl.DateTimeFormat(intlLocale, { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
  const timeText = new Intl.DateTimeFormat(intlLocale, { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" }).format(date);

  const pageUrl = `${siteUrl}${publicEventPath(event.slug)}`;
  const accent = event.primary_color ?? (isTemplateId(event.template_id) ? templates[event.template_id].palette.accent : "#8b6b3f");
  const onAccent = readableOn(accent);

  const rows: Array<[string, string]> = [
    [t("date"), dateText],
    [t("time"), timeText],
    ...(event.venue_name ? [[t("venue"), event.venue_name] as [string, string]] : []),
    ...(event.address ? [[t("address"), event.address] as [string, string]] : []),
    [t("guests"), t("guestCount", { count: to.guest_count })],
  ];

  const links = [
    { label: t("waze"), url: wazeUrl(event) },
    { label: t("googleMaps"), url: googleMapsUrl(event) },
    { label: t("calendar"), url: googleCalendarUrl(event, pageUrl) },
  ].filter((l): l is { label: string; url: string } => Boolean(l.url));

  const subject = (options.test ? t("testPrefix") : "") + t("subject", { title: event.title, date: dateText });
  const align = rtl ? "right" : "left";

  const html = `<!doctype html>
<html lang="${locale}" dir="${rtl ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f2ee;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;" dir="${rtl ? "rtl" : "ltr"}">
<tr><td style="background:${accent};color:${onAccent};padding:28px 28px 22px;text-align:${align};">
<div style="font-size:24px;font-weight:bold;line-height:1.3;">${escapeHtml(event.title)}</div>
</td></tr>
<tr><td style="padding:24px 28px 8px;text-align:${align};font-size:16px;line-height:1.6;">
${options.test ? `<p style="margin:0 0 16px;padding:10px 12px;background:#fff7d6;border-radius:8px;font-size:14px;">${escapeHtml(t("testNotice"))}</p>` : ""}
<p style="margin:0 0 8px;">${escapeHtml(t("greeting", { name: to.full_name }))}</p>
<p style="margin:0 0 16px;">${escapeHtml(t("intro"))}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="padding:6px 0;color:#78716c;font-size:14px;width:110px;vertical-align:top;text-align:${align};">${escapeHtml(label)}</td><td style="padding:6px 0;font-weight:bold;text-align:${align};">${escapeHtml(value)}</td></tr>`,
  )
  .join("\n")}
</table>
</td></tr>
<tr><td style="padding:16px 28px;text-align:center;">
<a href="${escapeHtml(pageUrl)}" style="display:inline-block;background:${accent};color:${onAccent};text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:999px;">${escapeHtml(t("openInvitation"))}</a>
</td></tr>
<tr><td style="padding:0 28px 20px;text-align:center;font-size:14px;">
${links.map((l) => `<a href="${escapeHtml(l.url)}" style="color:${accent};margin:0 8px;">${escapeHtml(l.label)}</a>`).join(" · ")}
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #eee;color:#78716c;font-size:13px;line-height:1.5;text-align:${align};">${escapeHtml(t("update"))}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    options.test ? t("testNotice") : null,
    t("greeting", { name: to.full_name }),
    t("intro"),
    "",
    event.title,
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `${t("openInvitation")}: ${pageUrl}`,
    ...links.map((l) => `${l.label}: ${l.url}`),
    "",
    t("update"),
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { to: to.email, subject, html, text };
}
