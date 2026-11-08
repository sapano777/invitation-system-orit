import "server-only";
import { buildReminderEmail, type ReminderEvent } from "@/lib/email/reminder";
import { sendEmails, type EmailProvider, type OutgoingEmail, type SendResult } from "@/lib/email/transport";
import { isReminderDue } from "@/lib/reminder-schedule";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailKind } from "@/lib/types/database";

const EVENT_COLUMNS =
  "id, slug, title, description, date_time, venue_name, address, lat, lng, template_id, primary_color, updated_at, reminder_offset_hours, reminder_sent_at, is_active";

export type SendSummary = { sent: number; failed: number; recipients: number };

type Recipient = { id: string | null; email: string; full_name: string; guest_count: number; locale: "he" | "en" };

async function sendAndLog(
  event: ReminderEvent,
  recipients: Recipient[],
  kind: EmailKind,
  siteUrl: string,
  options: { test?: boolean } = {},
): Promise<SendSummary> {
  const emails: OutgoingEmail[] = recipients.map((r) => buildReminderEmail(event, r, siteUrl, options));
  let provider: EmailProvider | null = null;
  let results: SendResult[];
  try {
    ({ provider, results } = await sendEmails(emails));
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    results = emails.map(() => ({ ok: false, error }));
  }

  const rows = recipients.map((r, i) => {
    const result = results[i];
    return {
      event_id: event.id,
      registration_id: r.id,
      kind,
      to_email: r.email,
      status: result.ok ? (provider === "dry_run" ? ("dry_run" as const) : ("sent" as const)) : ("failed" as const),
      provider,
      provider_id: result.ok ? result.id : null,
      error: result.ok ? null : result.error.slice(0, 500),
    };
  });
  if (rows.length > 0) {
    const { error } = await createAdminClient().from("email_log").insert(rows);
    if (error) console.error("email_log insert failed", error);
  }

  const sent = results.filter((r) => r.ok).length;
  return { sent, failed: results.length - sent, recipients: recipients.length };
}

async function confirmedRecipients(eventId: string, registrationId?: string): Promise<Recipient[]> {
  let query = createAdminClient()
    .from("registrations")
    .select("id, email, full_name, guest_count, locale")
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .not("email", "is", null);
  if (registrationId) query = query.eq("id", registrationId);
  const { data, error } = await query;
  if (error) throw new Error(`registrations_load_failed: ${error.message}`);
  return data.map((r) => ({ ...r, email: r.email! }));
}

async function loadEvent(eventId: string) {
  const { data } = await createAdminClient().from("events").select(EVENT_COLUMNS).eq("id", eventId).maybeSingle();
  return data;
}

// Marks the event's reminder as sent, unless another run already did. Only
// the run that wins the claim sends, so overlapping runs can't double-send.
async function claimReminder(eventId: string) {
  const { data } = await createAdminClient()
    .from("events")
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq("id", eventId)
    .is("reminder_sent_at", null)
    .select("id");
  return Boolean(data?.length);
}

// Cron: send every reminder that is due.
export async function runDueReminders(siteUrl: string, now = Date.now()) {
  const { data: events, error } = await createAdminClient()
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("is_active", true)
    .is("reminder_sent_at", null)
    .not("reminder_offset_hours", "is", null)
    .gt("date_time", new Date(now).toISOString());
  if (error) throw new Error(`events_load_failed: ${error.message}`);

  const processed: Array<{ eventId: string; title: string } & SendSummary> = [];
  for (const event of events.filter((e) => isReminderDue(e, now))) {
    if (!(await claimReminder(event.id))) continue;
    const summary = await sendAndLog(event, await confirmedRecipients(event.id), "reminder_auto", siteUrl);
    processed.push({ eventId: event.id, title: event.title, ...summary });
  }
  return processed;
}

// Staff: send the reminder now to everyone (counts as the automatic one).
export async function sendRemindersToAll(eventId: string, siteUrl: string) {
  const event = await loadEvent(eventId);
  if (!event) return null;
  await createAdminClient().from("events").update({ reminder_sent_at: new Date().toISOString() }).eq("id", eventId);
  return sendAndLog(event, await confirmedRecipients(eventId), "reminder_manual", siteUrl);
}

// Staff: send the reminder to one guest.
export async function sendReminderToRegistration(eventId: string, registrationId: string, siteUrl: string) {
  const event = await loadEvent(eventId);
  if (!event) return null;
  const recipients = await confirmedRecipients(eventId, registrationId);
  if (recipients.length === 0) return { sent: 0, failed: 0, recipients: 0 };
  return sendAndLog(event, recipients, "reminder_manual", siteUrl);
}

// Staff: preview the reminder in their own inbox.
export async function sendTestReminder(eventId: string, to: { email: string; name: string; locale: "he" | "en" }, siteUrl: string) {
  const event = await loadEvent(eventId);
  if (!event) return null;
  return sendAndLog(event, [{ id: null, email: to.email, full_name: to.name, guest_count: 1, locale: to.locale }], "test", siteUrl, { test: true });
}
