import { getFormatter, getTranslations } from "next-intl/server";
import type { PublicEvent } from "@/lib/public-event";

export async function EventInfo({ event, align = "center" }: { event: PublicEvent; align?: "center" | "start" }) {
  const t = await getTranslations("invitation");
  const format = await getFormatter();
  const date = new Date(event.date_time);

  const rows = [
    { label: t("date"), value: format.dateTime(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
    { label: t("time"), value: format.dateTime(date, { hour: "2-digit", minute: "2-digit" }) },
    event.venue_name && { label: t("venue"), value: event.venue_name },
    event.address && { label: t("address"), value: event.address },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <dl className={`flex flex-col gap-3 ${align === "center" ? "text-center" : ""}`}>
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-xs uppercase tracking-wider text-muted">{row.label}</dt>
          <dd className="text-lg font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
