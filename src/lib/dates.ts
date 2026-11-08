// The business works in Israel time. Forms use <input type="datetime-local">,
// which has no time zone, so we convert explicitly instead of trusting the
// server's or the browser's zone.

export const TIME_ZONE = "Asia/Jerusalem";

const LOCAL_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function isLocalDateTime(value: string) {
  return LOCAL_INPUT.test(value);
}

// Milliseconds to add to UTC to get wall-clock time in `timeZone` at `utcMs`.
function zoneOffsetMs(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

// "2027-03-14T19:30" in Israel time -> ISO string in UTC.
export function zonedInputToIso(value: string, timeZone = TIME_ZONE): string | null {
  const m = LOCAL_INPUT.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const wallAsUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes handle the hour around daylight-saving changes.
  let utc = wallAsUtc - zoneOffsetMs(wallAsUtc, timeZone);
  utc = wallAsUtc - zoneOffsetMs(utc, timeZone);
  const date = new Date(utc);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// ISO string -> "2027-03-14T19:30" in Israel time, for an input's value.
export function isoToZonedInput(iso: string | null | undefined, timeZone = TIME_ZONE): string {
  if (!iso) return "";
  const utc = new Date(iso).getTime();
  if (Number.isNaN(utc)) return "";
  const wall = new Date(utc + zoneOffsetMs(utc, timeZone));
  return wall.toISOString().slice(0, 16);
}
