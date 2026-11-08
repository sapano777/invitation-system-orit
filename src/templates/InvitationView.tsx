import type { ReactNode } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { registrationAvailability, type PublicEvent } from "@/lib/public-event";
import { getSiteUrl } from "@/lib/site";
import { ActionLinks } from "./blocks/ActionLinks";
import { Countdown } from "./blocks/Countdown";
import { EventInfo } from "./blocks/EventInfo";
import { Media } from "./blocks/Media";
import { Registration } from "./blocks/Registration";
import { templateFontVariables } from "./fonts";
import { InvitationTemplate } from "./InvitationTemplate";
import { buildTheme } from "./theme";

function availabilityNow(event: PublicEvent) {
  return registrationAvailability(event, Date.now());
}

type Props = {
  event: PublicEvent;
  // Admin preview: same page, registration form shown but disabled.
  preview?: boolean;
  // Rendered in the top bar (language switcher, or the preview controls).
  toolbar: ReactNode;
};

// The full invitation: theme, layout and shared pieces. Used by the public
// page and the admin preview so both always look the same.
export async function InvitationView({ event, preview = false, toolbar }: Props) {
  const [t, format, siteUrl] = await Promise.all([getTranslations("invitation"), getFormatter(), getSiteUrl()]);
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
        preview={preview}
        deadlineText={event.rsvp_deadline ? format.dateTime(new Date(event.rsvp_deadline), { dateStyle: "long", timeStyle: "short" }) : null}
      />
    ),
  };

  return (
    <div
      style={theme.style}
      data-template={theme.id}
      className={`${templateFontVariables} flex min-h-full flex-1 flex-col bg-background text-foreground`}
    >
      <div className="flex items-center justify-end gap-3 px-3 pt-3">{toolbar}</div>
      <InvitationTemplate
        id={theme.id}
        event={event}
        parts={parts}
        labels={{ invited: t(`invited.${event.event_type}`), rsvpTitle: t("rsvpTitle") }}
      />
    </div>
  );
}
