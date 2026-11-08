import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { requireStaff } from "@/lib/auth";
import { getEvent } from "@/lib/events/queries";
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

  const t = await getTranslations();
  const format = await getFormatter();
  const publicUrl = `${await getSiteUrl()}${publicEventPath(event.slug)}`;

  const details: Array<[string, React.ReactNode]> = [
    [t("eventForm.date_time"), format.dateTime(new Date(event.date_time), { dateStyle: "full", timeStyle: "short" })],
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

      <section className="grid gap-6 rounded-2xl border border-border bg-surface p-5 md:grid-cols-[1fr_auto]">
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
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-2 font-semibold">{t("eventForm.description")}</h2>
          <p className="whitespace-pre-line">{event.description}</p>
        </section>
      )}

      <p className="text-sm text-muted">{t("eventPage.registrationsSoon")}</p>
    </div>
  );
}
