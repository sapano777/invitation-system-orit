"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { emailProvider } from "@/lib/email/transport";
import { sendReminderToRegistration, sendRemindersToAll, sendTestReminder, type SendSummary } from "@/lib/reminders";
import { getSiteUrl } from "@/lib/site";

export type ReminderActionResult = { ok: true; summary: SendSummary } | { ok: false; error: "not_configured" | "no_email" | "failed" };

function toResult(summary: SendSummary | null): ReminderActionResult {
  if (!summary) return { ok: false, error: "failed" };
  if (summary.recipients > 0 && summary.sent === 0) return { ok: false, error: "failed" };
  return { ok: true, summary };
}

export async function sendReminderNow(eventId: string, registrationId: string): Promise<ReminderActionResult> {
  await requireStaff();
  if (!emailProvider()) return { ok: false, error: "not_configured" };
  const summary = await sendReminderToRegistration(eventId, registrationId, await getSiteUrl());
  revalidatePath(`/admin/events/${eventId}`);
  if (summary && summary.recipients === 0) return { ok: false, error: "no_email" };
  return toResult(summary);
}

export async function sendReminderToAllNow(eventId: string): Promise<ReminderActionResult> {
  await requireStaff();
  if (!emailProvider()) return { ok: false, error: "not_configured" };
  const summary = await sendRemindersToAll(eventId, await getSiteUrl());
  revalidatePath(`/admin/events/${eventId}`);
  return toResult(summary);
}

export async function sendTestToMe(eventId: string): Promise<ReminderActionResult> {
  const user = await requireStaff();
  if (!emailProvider()) return { ok: false, error: "not_configured" };
  if (!user.email) return { ok: false, error: "no_email" };
  const locale = (await getLocale()) === "en" ? "en" : "he";
  const summary = await sendTestReminder(eventId, { email: user.email, name: user.displayName ?? user.email, locale }, await getSiteUrl());
  revalidatePath(`/admin/events/${eventId}`);
  return toResult(summary);
}
