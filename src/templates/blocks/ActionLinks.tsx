import { getTranslations } from "next-intl/server";
import { googleCalendarUrl } from "@/lib/calendar";
import { googleMapsUrl, wazeUrl } from "@/lib/navigation";
import type { PublicEvent } from "@/lib/public-event";
import { publicEventPath } from "@/lib/site";

const linkClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent";

export async function ActionLinks({ event, siteUrl }: { event: PublicEvent; siteUrl: string }) {
  const t = await getTranslations("invitation.actions");
  const pageUrl = `${siteUrl}${publicEventPath(event.slug)}`;
  const waze = wazeUrl(event);
  const maps = googleMapsUrl(event);

  return (
    <div className="flex flex-col items-center gap-3">
      {(waze || maps) && (
        <div className="flex flex-wrap justify-center gap-2">
          {waze && <a href={waze} target="_blank" rel="noreferrer" className={linkClass}>{t("waze")}</a>}
          {maps && <a href={maps} target="_blank" rel="noreferrer" className={linkClass}>{t("googleMaps")}</a>}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <a href={`${publicEventPath(event.slug)}/calendar.ics`} className={linkClass}>{t("calendar")}</a>
        <a href={googleCalendarUrl(event, pageUrl)} target="_blank" rel="noreferrer" className={linkClass}>{t("googleCalendar")}</a>
      </div>
      {event.gift_link_url && (
        <a
          href={event.gift_link_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:opacity-90"
        >
          {t("gift")}
        </a>
      )}
    </div>
  );
}
