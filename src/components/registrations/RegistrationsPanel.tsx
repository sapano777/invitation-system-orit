"use client";

import { useCallback, useDeferredValue, useMemo, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { deleteRegistration } from "@/app/admin/events/[id]/registrations/actions";
import { sendReminderNow, type ReminderActionResult } from "@/app/admin/events/[id]/reminders/actions";
import { Button, buttonClass } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { formatPhone } from "@/lib/phone";
import { guestNamesList } from "@/lib/registration/guest-names";
import { mailtoUrl, whatsappUrl } from "@/lib/reminder-links";
import type { RegistrationRow } from "@/lib/types/database";
import { RegistrationDialog } from "./RegistrationDialog";

export type ReminderContext = {
  title: string;
  date: string;
  time: string;
  venue: string | null;
  url: string;
};

type Props = {
  eventId: string;
  registrations: RegistrationRow[];
  reminder: ReminderContext;
  exportHref: string;
  // When the server can send email, the email button sends the reminder
  // directly; otherwise it opens the staff member's mail app.
  emailEnabled: boolean;
};

type StatusFilter = "confirmed" | "cancelled" | "all";

// Search text for a registration: names, phone in both formats, email, notes.
function haystack(r: RegistrationRow) {
  return [r.full_name, r.phone, formatPhone(r.phone).replace(/\D/g, ""), r.email, r.notes, ...guestNamesList(r.guest_names)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function RegistrationsPanel({ eventId, registrations, reminder, exportHref, emailEnabled }: Props) {
  const t = useTranslations("registrations");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [status, setStatus] = useState<StatusFilter>("confirmed");
  const [withEmail, setWithEmail] = useState(false);
  const [withNotes, setWithNotes] = useState(false);
  const [dialog, setDialog] = useState<{ registration: RegistrationRow | null } | null>(null);
  const closeDialog = useCallback(() => setDialog(null), []);

  const indexed = useMemo(() => registrations.map((r) => ({ r, text: haystack(r) })), [registrations]);

  const visible = useMemo(() => {
    const words = deferredQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return indexed
      .filter(({ r, text }) => {
        if (status !== "all" && r.status !== status) return false;
        if (withEmail && !r.email) return false;
        if (withNotes && !r.notes) return false;
        // Digits typed with dashes ("050-12") still match the phone.
        return words.every((w) => text.includes(w) || (/\d/.test(w) && text.includes(w.replace(/\D/g, ""))));
      })
      .map(({ r }) => r);
  }, [indexed, deferredQuery, status, withEmail, withNotes]);

  return (
    <section className="flex flex-col gap-4" aria-labelledby="registrations-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="registrations-title" className="text-xl font-bold">{t("title")}</h2>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setDialog({ registration: null })}>{t("add")}</Button>
          <a href={exportHref} className={buttonClass("secondary")}>{t("export")}</a>
        </div>
      </div>

      {registrations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">{t("empty")}</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-center">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className={`${inputClass} sm:max-w-sm`}
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              aria-label={t("filters.status")}
              className={`${inputClass} sm:w-auto`}
            >
              {(["confirmed", "cancelled", "all"] as const).map((s) => (
                <option key={s} value={s}>{t(`filters.${s}`)}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={withEmail} onChange={(e) => setWithEmail(e.target.checked)} />
              {t("filters.withEmail")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={withNotes} onChange={(e) => setWithNotes(e.target.checked)} />
              {t("filters.withNotes")}
            </label>
          </div>

          <p className="text-sm text-muted" aria-live="polite">{t("showing", { shown: visible.length, total: registrations.length })}</p>

          {visible.length === 0 ? (
            <p className="p-6 text-center text-muted">{t("noMatches")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visible.map((r) => (
                <RegistrationItem
                  key={r.id}
                  eventId={eventId}
                  registration={r}
                  reminder={reminder}
                  emailEnabled={emailEnabled}
                  onEdit={() => setDialog({ registration: r })}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {dialog && <RegistrationDialog eventId={eventId} registration={dialog.registration} onClose={closeDialog} />}
    </section>
  );
}

type ItemProps = {
  eventId: string;
  registration: RegistrationRow;
  reminder: ReminderContext;
  emailEnabled: boolean;
  onEdit: () => void;
};

function RegistrationItem({ eventId, registration: r, reminder, emailEnabled, onEdit }: ItemProps) {
  const t = useTranslations();
  const format = useFormatter();
  const [deleting, startDelete] = useTransition();
  const [sending, startSend] = useTransition();
  const [sendResult, setSendResult] = useState<ReminderActionResult | null>(null);
  const names = guestNamesList(r.guest_names);

  const message = t("reminders.message", {
    name: r.full_name,
    title: reminder.title,
    date: reminder.date,
    time: reminder.time,
    hasVenue: reminder.venue ? "yes" : "no",
    venue: reminder.venue ?? "",
    url: reminder.url,
  });
  const subject = t("reminders.emailSubject", { title: reminder.title });

  const actionClass = "rounded-lg border border-border px-3 py-1.5 text-sm hover:border-accent";

  return (
    <li className={`rounded-xl border border-border bg-surface p-4 ${r.status === "cancelled" ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{r.full_name}</span>
            <span className="rounded-full bg-background px-2 py-0.5 text-xs">{t("registrations.guestCount", { count: r.guest_count })}</span>
            {r.status === "cancelled" && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-200">{t("registrations.status.cancelled")}</span>
            )}
            {r.source === "manual" && <span className="text-xs text-muted">{t("registrations.source.manual")}</span>}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span dir="ltr">{formatPhone(r.phone)}</span>
            {r.email && <span dir="ltr" className="break-all">{r.email}</span>}
            <span>{format.dateTime(new Date(r.created_at), { dateStyle: "short", timeStyle: "short" })}</span>
          </div>
          {names.length > 0 && <p className="text-sm">{names.join(", ")}</p>}
          {r.notes && <p className="rounded-lg bg-background px-3 py-2 text-sm">{r.notes}</p>}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <a href={whatsappUrl(r.phone, message)} target="_blank" rel="noreferrer" className={`${actionClass} text-green-700 dark:text-green-400`}>
            {t("registrations.actions.whatsapp")}
          </a>
          {r.email && emailEnabled && r.status === "confirmed" ? (
            <button
              type="button"
              disabled={sending}
              title={t("registrations.actions.sendEmailTitle", { email: r.email })}
              onClick={() => startSend(async () => setSendResult(await sendReminderNow(eventId, r.id)))}
              className={`${actionClass} disabled:opacity-50`}
            >
              {sending
                ? t("reminderPanel.sending")
                : sendResult?.ok
                  ? t("reminderPanel.sent")
                  : t("registrations.actions.sendEmail")}
            </button>
          ) : r.email ? (
            <a href={mailtoUrl(r.email, subject, message)} className={actionClass}>{t("registrations.actions.email")}</a>
          ) : (
            <span className={`${actionClass} cursor-not-allowed text-muted opacity-60`} title={t("registrations.actions.noEmail")}>
              {t("registrations.actions.email")}
            </span>
          )}
          <button type="button" onClick={onEdit} className={actionClass}>{t("registrations.actions.edit")}</button>
          {sendResult && !sendResult.ok && (
            <span role="alert" className="w-full text-xs text-red-600">{t(`reminderPanel.errors.${sendResult.error}`)}</span>
          )}
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (window.confirm(t("registrations.actions.deleteConfirm", { name: r.full_name }))) {
                startDelete(() => deleteRegistration(eventId, r.id));
              }
            }}
            className={`${actionClass} text-red-600 disabled:opacity-50`}
          >
            {t("registrations.actions.delete")}
          </button>
        </div>
      </div>
    </li>
  );
}
