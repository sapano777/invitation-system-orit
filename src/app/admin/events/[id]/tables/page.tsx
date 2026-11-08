import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SeatingBoard } from "@/components/SeatingBoard";
import { requireStaff } from "@/lib/auth";
import { getEvent, getRegistrations, getSeating } from "@/lib/events/queries";

export async function generateMetadata({ params }: PageProps<"/admin/events/[id]/tables">): Promise<Metadata> {
  const event = await getEvent((await params).id);
  const t = await getTranslations("seating");
  return { title: event ? `${t("title")}: ${event.title}` : t("title") };
}

export default async function TablesPage({ params }: PageProps<"/admin/events/[id]/tables">) {
  await requireStaff();
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const [t, registrations, seating] = await Promise.all([getTranslations("seating"), getRegistrations(event.id), getSeating(event.id)]);
  // Only confirmed guests are seated; oldest registrations first.
  const guests = registrations
    .filter((r) => r.status === "confirmed")
    .reverse()
    .map((r) => ({ id: r.id, full_name: r.full_name, guest_count: r.guest_count }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/admin/events/${event.id}`} className="text-sm text-muted underline-offset-2 hover:underline">
          {t("back", { title: event.title })}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("hint")}</p>
      </div>
      <SeatingBoard eventId={event.id} tables={seating.tables} guests={guests} assignments={seating.assignments} />
    </div>
  );
}
