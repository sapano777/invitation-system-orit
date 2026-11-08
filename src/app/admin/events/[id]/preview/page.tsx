import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { requireStaff } from "@/lib/auth";
import { getEvent, getRegistrations, summarize } from "@/lib/events/queries";
import { InvitationView } from "@/templates/InvitationView";

export async function generateMetadata({ params }: PageProps<"/admin/events/[id]/preview">): Promise<Metadata> {
  const event = await getEvent((await params).id);
  const t = await getTranslations("preview");
  return { title: event ? `${t("banner")}: ${event.title}` : t("banner") };
}

// The invitation exactly as guests see it, for any event (including inactive
// ones), with the registration form disabled. It covers the admin chrome so
// the layout is shown at full width.
export default async function PreviewPage({ params }: PageProps<"/admin/events/[id]/preview">) {
  await requireStaff();
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const [t, registrations] = await Promise.all([getTranslations("preview"), getRegistrations(event.id)]);
  const publicEvent = { ...event, guests_taken: summarize(registrations).guests };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background">
      <InvitationView
        event={publicEvent}
        preview
        toolbar={
          <>
            <span className="me-auto rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-black">
              {t("banner")}
              {!event.is_active && <span className="font-normal"> · {t("inactive")}</span>}
            </span>
            <Link href={`/admin/events/${event.id}`} className="rounded-full border border-border bg-surface px-3 py-1 text-sm">
              {t("back")}
            </Link>
            <LocaleSwitcher />
          </>
        }
      />
    </div>
  );
}
