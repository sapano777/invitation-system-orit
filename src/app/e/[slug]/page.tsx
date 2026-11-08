import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getPublicEvent } from "@/lib/public-event";
import { getSiteUrl, publicEventPath } from "@/lib/site";
import { InvitationView } from "@/templates/InvitationView";

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

export default async function InvitationPage({ params }: PageProps<"/e/[slug]">) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) notFound();

  return <InvitationView event={event} toolbar={<LocaleSwitcher />} />;
}
