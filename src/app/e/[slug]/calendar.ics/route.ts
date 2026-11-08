import { buildIcs } from "@/lib/calendar";
import { getPublicEvent } from "@/lib/public-event";
import { getSiteUrl, publicEventPath } from "@/lib/site";

export async function GET(_request: Request, { params }: RouteContext<"/e/[slug]/calendar.ics">) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) return new Response("Not found", { status: 404 });

  const siteUrl = await getSiteUrl();
  const ics = buildIcs(event, `${siteUrl}${publicEventPath(event.slug)}`, new URL(siteUrl).host);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
