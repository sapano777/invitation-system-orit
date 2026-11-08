import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { EventForm } from "@/components/EventForm";
import { requireStaff } from "@/lib/auth";
import { getEvent } from "@/lib/events/queries";
import { updateEvent } from "../../actions";

export async function generateMetadata({ params }: PageProps<"/admin/events/[id]/edit">): Promise<Metadata> {
  const event = await getEvent((await params).id);
  const t = await getTranslations("admin");
  return { title: event ? `${t("edit")}: ${event.title}` : t("edit") };
}

export default async function EditEventPage({ params }: PageProps<"/admin/events/[id]/edit">) {
  await requireStaff();
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.edit")}: {event.title}</h1>
      <EventForm event={event} action={updateEvent.bind(null, event.id)} cancelHref={`/admin/events/${event.id}`} />

      <section className="rounded-2xl border border-red-200 p-5 dark:border-red-900">
        <h2 className="mb-1 font-semibold">{t("eventPage.dangerZone")}</h2>
        <p className="mb-4 text-sm text-muted">{t("eventPage.deleteHint")}</p>
        <DeleteEventButton eventId={event.id} title={event.title} />
      </section>
    </div>
  );
}
