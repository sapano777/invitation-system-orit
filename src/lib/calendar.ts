// "Add to calendar": an .ics file (Apple / Outlook / most phones) and a
// Google Calendar link. Events have no end time, so we assume 3 hours.

const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  date_time: string;
  venue_name: string | null;
  address: string | null;
  updated_at: string;
};

function utcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function location(event: CalendarEvent) {
  return [event.venue_name, event.address].filter(Boolean).join(", ");
}

function details(event: CalendarEvent, url: string) {
  return [event.description, url].filter(Boolean).join("\n\n");
}

// RFC 5545 text escaping and 75-octet line folding.
function escapeText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const charSize = new TextEncoder().encode(char).length;
    if (size + charSize > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += charSize;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildIcs(event: CalendarEvent, url: string, host: string) {
  const start = new Date(event.date_time);
  const end = new Date(start.getTime() + DEFAULT_DURATION_MS);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//invitation-system-orit//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@${host}`,
    `DTSTAMP:${utcStamp(new Date(event.updated_at))}`,
    `DTSTART:${utcStamp(start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    location(event) && `LOCATION:${escapeText(location(event))}`,
    `DESCRIPTION:${escapeText(details(event, url))}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function googleCalendarUrl(event: CalendarEvent, url: string) {
  const start = new Date(event.date_time);
  const end = new Date(start.getTime() + DEFAULT_DURATION_MS);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${utcStamp(start)}/${utcStamp(end)}`,
    details: details(event, url),
    location: location(event),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
