// When an event's automatic reminder goes out. Shared by the cron job and the
// admin page, so what staff see matches what the job does.

const HOUR = 60 * 60 * 1000;

// How often the cron job runs. Vercel's Hobby plan allows one run a day; set
// REMINDER_RUN_INTERVAL_HOURS=1 if it runs hourly (Pro plan or external cron).
export function runIntervalHours() {
  const value = Number(process.env.REMINDER_RUN_INTERVAL_HOURS ?? 24);
  return Number.isFinite(value) && value > 0 ? value : 24;
}

type Schedulable = {
  date_time: string;
  reminder_offset_hours: number | null;
  reminder_sent_at: string | null;
  is_active: boolean;
};

export function reminderDueAt(event: Pick<Schedulable, "date_time" | "reminder_offset_hours">): Date | null {
  if (event.reminder_offset_hours === null) return null;
  return new Date(new Date(event.date_time).getTime() - event.reminder_offset_hours * HOUR);
}

// A run sends every reminder that falls due before the next run, so with a
// daily run a "1 day before" reminder goes out on the morning before that.
// Reminders whose time already passed (e.g. the event was created late) still
// go out, as long as the event hasn't started.
export function isReminderDue(event: Schedulable, now: number, intervalHours = runIntervalHours()) {
  const due = reminderDueAt(event);
  if (!due || event.reminder_sent_at || !event.is_active) return false;
  if (new Date(event.date_time).getTime() <= now) return false;
  return due.getTime() <= now + intervalHours * HOUR;
}
