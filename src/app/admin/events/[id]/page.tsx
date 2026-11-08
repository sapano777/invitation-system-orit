import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { RegistrationsPanel } from "@/components/registrations/RegistrationsPanel";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { requireStaff } from "@/lib/auth";
import { getEvent, getRegistrations, summarize } from "@/lib/events/queries";
import { getSiteUrl, publicEventPath } from "@/lib/site";
import { isTemplateId } from "@/templates/registry";

export async function generateMetadata({ params }: PageProps<"/admin/events/[id]">): Promise<Metadata> {
  const event = await getEvent((await params).id);
  return { title: event?.title };
}

export default async function EventPage({ params }: PageProps<"/admin/events/[id]">) {
  await requireStaff();
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const [t, format, siteUrl, registrations] = await Promise.all([
    getTranslations(),
    getFormatter(),
    getSiteUrl(),
    getRegistrations(event.id),
  ]);
  const publicUrl = `${siteUrl}${publicEventPath(event.slug)}`;
  const summary = summarize(registrations);
  const eventDate = new Date(event.date_time);

  const details: Array<[string, React.ReactNode]> = [
    [t("eventForm.date_time"), format.dateTime(eventDate, { dateStyle: "full", timeStyle: "short" })],
    [t("eventForm.event_type"), t(`eventForm.types.${event.event_type}`)],
    [t("eventForm.venue_name"), event.venue_name],
    [t("eventForm.address"), event.address],
    [t("eventPage.template"), isTemplateId(event.template_id) ? t(`templates.names.${event.template_id}`) : event.template_id],
    [t("eventForm.rsvp_deadline"), event.rsvp_deadline && format.dateTime(new Date(event.rsvp_deadline), { dateStyle: "medium", timeStyle: "short" })],
    [t("eventForm.max_guests"), event.max_guests],
    [
      t("eventForm.gift_link_url"),
      event.gift_link_url && (
        <a href={event.gift_link_url} target="_blank" rel="noreferrer" dir="ltr" className="break-all text-accent underline underline-offset-2">
          {event.gift_link_url}
        </a>
      ),
    ],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 dir="auto" className="text-2xl font-bold">{event.title}</h1>
          {!event.is_active && <p className="mt-1 text-sm text-red-600">{t("eventPage.inactiveNotice")}</p>}
        </div>
        <ButtonLink href={`/admin/events/${event.id}/edit`} variant="secondary">
          {t("admin.edit")}
        </ButtonLink>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-1 font-semibold">{t("eventPage.publicLink")}</h2>
        <p className="mb-3 text-sm text-muted">{t("eventPage.publicLinkHint")}</p>
        <p dir="ltr" className="mb-4 break-all rounded-lg bg-background p-3 font-mono text-sm">{publicUrl}</p>
        <div className="flex flex-wrap gap-2">
          <CopyLinkButton url={publicUrl} />
          <a href={publicEventPath(event.slug)} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
            {t("eventPage.openPublic")}
          </a>
        </div>
      </section>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("eventPage.summary.registrations"), value: summary.registrations },
          {
            label: t("eventPage.summary.guests"),
            value: summary.guests,
            sub: event.max_guests ? t("eventPage.summary.capacity", { max: event.max_guests }) : null,
          },
          { label: t("eventPage.summary.withEmail"), value: summary.withEmail },
          { label: t("eventPage.summary.cancelled"), value: summary.cancelled },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-surface p-4">
            <dt className="text-sm text-muted">{stat.label}</dt>
            <dd className="text-3xl font-bold tabular-nums">{stat.value}</dd>
            {stat.sub && <dd className="text-xs text-muted">{stat.sub}</dd>}
          </div>
        ))}
      </dl>

      <RegistrationsPanel
        eventId={event.id}
        registrations={registrations}
        exportHref={`/admin/events/${event.id}/export`}
        reminder={{
          title: event.title,
          date: format.dateTime(eventDate, { weekday: "long", day: "numeric", month: "long" }),
          time: format.dateTime(eventDate, { hour: "2-digit", minute: "2-digit" }),
          venue: event.venue_name,
          url: publicUrl,
        }}
      />

      <details className="rounded-2xl border border-border bg-surface">
        <summary className="cursor-pointer p-5 font-semibold">{t("eventPage.details")}</summary>
        <div className="flex flex-col gap-6 border-t border-border p-5">
          <section className="grid gap-6 md:grid-cols-[1fr_auto]">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[auto_1fr]">
              {details
                .filter(([, value]) => value !== null && value !== undefined && value !== "")
                .map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-sm text-muted">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
            {event.media_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.media_url} alt="" className="max-h-56 rounded-lg border border-border object-contain" />
            )}
          </section>

          {event.description && (
            <section>
              <h3 className="mb-2 font-semibold">{t("eventForm.description")}</h3>
              <p className="whitespace-pre-line">{event.description}</p>
            </section>
          )}
        </div>
      </details>
    </div>
  );
}
