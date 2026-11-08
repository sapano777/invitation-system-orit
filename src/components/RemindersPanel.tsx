"use client";

import { useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { sendReminderToAllNow, sendTestToMe, type ReminderActionResult } from "@/app/admin/events/[id]/reminders/actions";
import { Button } from "@/components/ui/Button";
import type { EmailProvider } from "@/lib/email/transport";
import type { EmailLogRow } from "@/lib/types/database";

type Props = {
  eventId: string;
  status: { kind: "off" | "past" } | { kind: "scheduled"; dueAt: string; daily: boolean } | { kind: "sent"; sentAt: string };
  recipients: number;
  provider: EmailProvider | null;
  log: EmailLogRow[];
};

export function RemindersPanel({ eventId, status, recipients, provider, log }: Props) {
  const t = useTranslations("reminderPanel");
  const format = useFormatter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ReminderActionResult | null>(null);
  const when = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "full", timeStyle: "short" });

  function run(action: () => Promise<ReminderActionResult>) {
    setResult(null);
    startTransition(async () => setResult(await action()));
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5" aria-labelledby="reminders-title">
      <h2 id="reminders-title" className="text-lg font-semibold">{t("title")}</h2>

      <div className="flex flex-col gap-1 text-sm">
        <p>
          {status.kind === "off" && t("statusOff")}
          {status.kind === "past" && t("statusPast")}
          {status.kind === "sent" && t("statusSent", { date: when(status.sentAt) })}
          {status.kind === "scheduled" && t("statusScheduled", { date: when(status.dueAt) })}
        </p>
        {status.kind === "scheduled" && status.daily && <p className="text-xs text-muted">{t("statusDailyNote")}</p>}
        <p className="text-muted">{t("recipients", { count: recipients })}</p>
      </div>

      {!provider && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">{t("notConfigured")}</p>}
      {provider === "dry_run" && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">{t("dryRun")}</p>}

      {provider && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => sendTestToMe(eventId))}>
            {t("sendTest")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending || recipients === 0 || status.kind === "past"}
            onClick={() => {
              if (window.confirm(t("sendAllConfirm", { count: recipients }))) run(() => sendReminderToAllNow(eventId));
            }}
          >
            {t("sendAll")}
          </Button>
        </div>
      )}

      <div aria-live="polite" className="text-sm">
        {pending && <p className="text-muted">{t("sending")}</p>}
        {result?.ok && <p className="text-green-700 dark:text-green-400">{t("result", { sent: result.summary.sent, failed: result.summary.failed })}</p>}
        {result && !result.ok && <p className="text-red-600">{t(`errors.${result.error}`)}</p>}
      </div>

      <details>
        <summary className="cursor-pointer text-sm font-medium">{t("log")} ({log.length})</summary>
        {log.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t("logEmpty")}</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-border text-sm">
            {log.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className={row.status === "failed" ? "text-red-600" : row.status === "sent" ? "text-green-700 dark:text-green-400" : "text-muted"}>
                  {t(`status.${row.status}`)}
                </span>
                <span dir="ltr" className="break-all">{row.to_email}</span>
                <span className="text-muted">{t(`kind.${row.kind}`)}</span>
                <span className="text-muted">{format.dateTime(new Date(row.created_at), { dateStyle: "short", timeStyle: "short" })}</span>
                {row.error && <span className="w-full text-xs text-red-600" dir="ltr">{row.error}</span>}
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}
