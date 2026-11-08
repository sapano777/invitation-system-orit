"use client";

import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { EventFormState } from "@/app/admin/events/actions";
import { LocationFields } from "@/components/LocationFields";
import { MediaUpload } from "@/components/MediaUpload";
import { TemplatePicker } from "@/components/TemplatePicker";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { isoToZonedInput } from "@/lib/dates";
import type { EventRow } from "@/lib/types/database";
import { defaultTemplateId, isTemplateId, templates, type TemplateId } from "@/templates/registry";

type Props = {
  event?: EventRow;
  action: (prev: EventFormState, formData: FormData) => Promise<EventFormState>;
  cancelHref: string;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function EventForm({ event, action, cancelHref }: Props) {
  const t = useTranslations("eventForm");
  const [state, formAction, pending] = useActionState(action, {});
  const [templateId, setTemplateId] = useState<TemplateId>(
    isTemplateId(event?.template_id) ? event.template_id : defaultTemplateId,
  );
  const [mediaUrl, setMediaUrl] = useState(event?.media_url ?? "");
  const [customColor, setCustomColor] = useState(Boolean(event?.primary_color));
  const [color, setColor] = useState(event?.primary_color ?? templates[templateId].palette.accent);

  const errors = state.fieldErrors ?? {};
  const err = (field: string) => {
    const code = errors[field];
    return code ? t(`errors.${code}`) : undefined;
  };
  const invalid = (field: string) => (errors[field] ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {});

  // Submit through a transition instead of <form action>, so React doesn't
  // reset the fields when the server returns validation errors.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <Section title={t("sections.details")}>
        <Field label={t("title")} htmlFor="title" required error={err("title")}>
          <input id="title" name="title" defaultValue={event?.title} required maxLength={200} className={inputClass} {...invalid("title")} />
        </Field>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">{t("event_type")}</legend>
          <div className="flex gap-2">
            {(["private", "business"] as const).map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 has-checked:border-accent has-checked:bg-background">
                <input type="radio" name="event_type" value={type} defaultChecked={(event?.event_type ?? "private") === type} />
                {t(`types.${type}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label={t("date_time")} htmlFor="date_time" required error={err("date_time")} hint={t("timeZoneHint")}>
          <input
            id="date_time"
            name="date_time"
            type="datetime-local"
            defaultValue={isoToZonedInput(event?.date_time)}
            required
            className={inputClass}
            {...invalid("date_time")}
          />
        </Field>

        <Field label={t("description")} htmlFor="description" error={err("description")}>
          <textarea id="description" name="description" rows={4} defaultValue={event?.description ?? ""} maxLength={5000} className={inputClass} />
        </Field>
      </Section>

      <Section title={t("sections.location")}>
        <LocationFields
          defaultVenue={event?.venue_name ?? ""}
          defaultAddress={event?.address ?? ""}
          defaultCoords={event?.lat != null && event?.lng != null ? { lat: event.lat, lng: event.lng } : null}
          errors={{ venue_name: errors.venue_name, address: errors.address, lat: errors.lat ?? errors.lng }}
        />
      </Section>

      <Section title={t("sections.design")}>
        <TemplatePicker value={templateId} onChange={setTemplateId} />
        {err("template_id") && <p className="text-xs text-red-600" role="alert">{err("template_id")}</p>}

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t("media")}</span>
          <MediaUpload value={mediaUrl} onChange={setMediaUrl} error={errors.media_url} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={customColor} onChange={(e) => setCustomColor(e.target.checked)} />
            {t("customColor")}
          </label>
          {customColor && (
            <input
              type="color"
              name="primary_color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label={t("customColor")}
              className="h-9 w-14 cursor-pointer rounded border border-border bg-surface"
            />
          )}
          {err("primary_color") && <p className="text-xs text-red-600" role="alert">{err("primary_color")}</p>}
        </div>
      </Section>

      <Section title={t("sections.more")}>
        <Field label={t("gift_link_url")} htmlFor="gift_link_url" hint={t("giftHint")} error={err("gift_link_url")}>
          <input
            id="gift_link_url"
            name="gift_link_url"
            type="url"
            dir="ltr"
            inputMode="url"
            placeholder="https://"
            defaultValue={event?.gift_link_url ?? ""}
            className={inputClass}
            {...invalid("gift_link_url")}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("rsvp_deadline")} htmlFor="rsvp_deadline" error={err("rsvp_deadline")}>
            <input
              id="rsvp_deadline"
              name="rsvp_deadline"
              type="datetime-local"
              defaultValue={isoToZonedInput(event?.rsvp_deadline)}
              className={inputClass}
              {...invalid("rsvp_deadline")}
            />
          </Field>
          <Field label={t("max_guests")} htmlFor="max_guests" hint={t("maxGuestsHint")} error={err("max_guests")}>
            <input
              id="max_guests"
              name="max_guests"
              type="number"
              min={1}
              inputMode="numeric"
              defaultValue={event?.max_guests ?? ""}
              className={inputClass}
              {...invalid("max_guests")}
            />
          </Field>
        </div>

        {!event && (
          <Field label={t("slug")} htmlFor="slug" hint={t("slugHint")} error={err("slug")}>
            <div className="flex items-center gap-1" dir="ltr">
              <span className="text-sm text-muted">/e/</span>
              <input id="slug" name="slug" maxLength={64} pattern="[a-z0-9][a-z0-9\-]{2,63}" className={inputClass} {...invalid("slug")} />
            </div>
          </Field>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={event?.is_active ?? true} className="mt-1" />
          <span>
            <span className="font-medium">{t("is_active")}</span>
            <span className="block text-xs text-muted">{t("isActiveHint")}</span>
          </span>
        </label>
      </Section>

      {state.formError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {t(`errors.${state.formError}`)}
        </p>
      )}
      {Object.keys(errors).length > 0 && !state.formError && (
        <p role="alert" className="text-sm text-red-600">{t("errors.fix_fields")}</p>
      )}

      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : event ? t("save") : t("create")}
        </Button>
        <ButtonLink href={cancelHref} variant="secondary">
          {t("cancel")}
        </ButtonLink>
      </div>
    </form>
  );
}
