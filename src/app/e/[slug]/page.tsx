import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getPublicEvent, registrationAvailability, type PublicEvent } from "@/lib/public-event";
import { getSiteUrl, publicEventPath } from "@/lib/site";
import { ActionLinks } from "@/templates/blocks/ActionLinks";
import { Countdown } from "@/templates/blocks/Countdown";
import { EventInfo } from "@/templates/blocks/EventInfo";
import { Media } from "@/templates/blocks/Media";
import { Registration } from "@/templates/blocks/Registration";
import { frankRuhl } from "@/templates/fonts";
import { InvitationTemplate } from "@/templates/InvitationTemplate";
import { buildTheme } from "@/templates/theme";

// Invitation links go to guests only; keep them out of search engines.
export async function generateMetadata({ params }: PageProps<"/e/[slug]">): Promise<Metadata> {
  const event = await getPublicEvent((await params).slug);
  if (!event) return { robots: { index: false } };

  const format = await getFormatter();
  const when = format.dateTime(new Date(event.date_time), { dateStyle: "full", timeStyle: "short" });
  const description = [when, event.venue_name].filter(Boolean).join(" · ");
  const url = `${await getSiteUrl()}${publicEventPath(event.slug)}`;

  return {
    title: { absolute: event.title },
    description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      url,
      title: event.title,
      description,
      // WhatsApp and most previews don't animate GIFs and some reject them.
      images: event.media_url && !event.media_url.endsWith(".gif") ? [{ url: event.media_url }] : undefined,
    },
  };
}

function availabilityNow(event: PublicEvent) {
  return registrationAvailability(event, Date.now());
}

export default async function InvitationPage({ params }: PageProps<"/e/[slug]">) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) notFound();

  const t = await getTranslations("invitation");
  const format = await getFormatter();
  const siteUrl = await getSiteUrl();
  const theme = buildTheme(event.template_id, event.primary_color);

  const parts = {
    media: event.media_url ? <Media url={event.media_url} /> : null,
    countdown: <Countdown dateTime={event.date_time} />,
    info: <EventInfo event={event} />,
    actions: <ActionLinks event={event} siteUrl={siteUrl} />,
    // No dir="auto": text that opens with a Latin word ("DJ, ...") would flip a
    // Hebrew sentence. Content follows the page direction instead.
    description: event.description ? <p className="whitespace-pre-line">{event.description}</p> : null,
    registration: (
      <Registration
        slug={event.slug}
        availability={availabilityNow(event)}
        deadlineText={event.rsvp_deadline ? format.dateTime(new Date(event.rsvp_deadline), { dateStyle: "long", timeStyle: "short" }) : null}
      />
    ),
  };

  return (
    <div style={theme.style} className={`${frankRuhl.variable} flex flex-1 flex-col bg-background text-foreground`}>
      <div className="flex justify-end px-3 pt-3">
        <LocaleSwitcher />
      </div>
      <InvitationTemplate id={theme.id} event={event} parts={parts} labels={{ invited: t(`invited.${event.event_type}`), rsvpTitle: t("rsvpTitle") }} />
    </div>
  );
}
