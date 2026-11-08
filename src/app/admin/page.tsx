import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/types/database";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("events") };
}

type ListEvent = Pick<EventRow, "id" | "title" | "date_time" | "venue_name" | "event_type" | "is_active"> & {
  registrations: Array<{ guest_count: number; status: string }>;
};

export default async function AdminHome() {
  await requireStaff();
  const t = await getTranslations("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, date_time, venue_name, event_type, is_active, registrations(guest_count, status)")
    .order("date_time", { ascending: true });

  const events = data ?? [];
  const { upcoming, past } = splitByTime(events);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("events")}</h1>
        <ButtonLink href="/admin/events/new">{t("newEvent")}</ButtonLink>
      </div>

      {error && <p role="alert" className="text-red-600">{t("loadError")}</p>}

      {!error && events.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="mb-4 text-muted">{t("empty")}</p>
          <ButtonLink href="/admin/events/new">{t("newEvent")}</ButtonLink>
        </div>
      )}

      {upcoming.length > 0 && <EventList title={t("upcoming")} events={upcoming} />}
      {past.length > 0 && <EventList title={t("past")} events={past} muted />}
    </div>
  );
}

// Upcoming soonest-first, past most-recent-first.
function splitByTime(events: ListEvent[]) {
  const now = Date.now();
  return {
    upcoming: events.filter((e) => new Date(e.date_time).getTime() >= now),
    past: events.filter((e) => new Date(e.date_time).getTime() < now).reverse(),
  };
}

async function EventList({ title, events, muted }: { title: string; events: ListEvent[]; muted?: boolean }) {
  const t = await getTranslations();
  const format = await getFormatter();

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-muted">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              href={`/admin/events/${event.id}`}
              className={`flex h-full flex-col gap-1 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent ${muted ? "opacity-75" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span dir="auto" className="font-semibold">{event.title}</span>
                <span className="flex shrink-0 gap-1 text-xs">
                  <span className="rounded-full bg-background px-2 py-0.5 text-muted">{t(`eventForm.types.${event.event_type}`)}</span>
                  {!event.is_active && <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-700 dark:bg-red-950 dark:text-red-200">{t("admin.inactive")}</span>}
                </span>
              </div>
              <span className="text-sm text-muted">
                {format.dateTime(new Date(event.date_time), { dateStyle: "full", timeStyle: "short" })}
              </span>
              {event.venue_name && <span className="text-sm text-muted">{event.venue_name}</span>}
              <span className="mt-1 text-sm font-medium text-accent">
                {t("admin.guestsSummary", {
                  guests: event.registrations.filter((r) => r.status === "confirmed").reduce((sum, r) => sum + r.guest_count, 0),
                })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
