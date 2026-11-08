import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { adminClient, SLUG_PREFIX, STAFF_EMAIL, STATE_FILE } from "./helpers";
import { cleanup } from "./global-teardown";

const TEMPLATES = ["classic", "minimal", "floral", "midnight", "gold", "kids", "corporate", "tech", "festive", "romantic"];

export default async function globalSetup() {
  const supabase = adminClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // The setup creates and deletes users and events: only on a local or
  // explicitly allowed project, never on production by accident.
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(url) && process.env.E2E_ALLOW_REMOTE !== "1") {
    throw new Error(`Refusing to run E2E setup against ${url}. Set E2E_ALLOW_REMOTE=1 for a dedicated test project.`);
  }

  await cleanup();

  const staffPassword = randomBytes(12).toString("base64url");
  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email: STAFF_EMAIL,
    password: staffPassword,
    email_confirm: true,
  });
  if (userError) throw userError;
  const { error: staffError } = await supabase.from("staff").insert({ user_id: user.user.id, display_name: "E2E" });
  if (staffError) throw staffError;

  const inDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString();
  const base = {
    date_time: inDays(30),
    venue_name: "אולם הבדיקות",
    address: "דיזנגוף 50, תל אביב",
    lat: 32.07551,
    lng: 34.77554,
    description: "אירוע לבדיקות אוטומטיות",
    gift_link_url: "https://example.com/gift",
    is_active: true,
  };
  const rows = [
    ...TEMPLATES.map((t) => ({ ...base, slug: `${SLUG_PREFIX}${t}`, title: `בדיקה ${t}`, template_id: t })),
    { ...base, slug: `${SLUG_PREFIX}full`, title: "בדיקה מלא", template_id: "classic", max_guests: 1 },
    { ...base, slug: `${SLUG_PREFIX}closed`, title: "בדיקה סגור", template_id: "classic", is_active: false },
    { ...base, slug: `${SLUG_PREFIX}admin`, title: "בדיקת ניהול", template_id: "corporate" },
    // One seating event per Playwright project, since projects run in parallel.
    ...["desktop", "iphone"].map((project) => ({ ...base, slug: `${SLUG_PREFIX}seating-${project}`, title: "בדיקת שולחנות", template_id: "classic" })),
  ];
  const { data: events, error } = await supabase.from("events").insert(rows).select("id, slug");
  if (error) throw error;

  const full = events.find((e) => e.slug === `${SLUG_PREFIX}full`)!;
  await supabase.from("registrations").insert({ event_id: full.id, full_name: "תופס מקום", phone: "972500000001", guest_count: 1 });

  for (const event of events.filter((e) => e.slug.startsWith(`${SLUG_PREFIX}seating-`))) {
    const { error: seatError } = await supabase.from("registrations").insert([
      { event_id: event.id, full_name: "משפחת כהן", phone: "972500000011", guest_count: 4, status: "confirmed" },
      { event_id: event.id, full_name: "משפחת לוי", phone: "972500000012", guest_count: 3, status: "confirmed" },
      { event_id: event.id, full_name: "זוג מזרחי", phone: "972500000013", guest_count: 2, status: "confirmed" },
      { event_id: event.id, full_name: "יוסי לבד", phone: "972500000014", guest_count: 1, status: "confirmed" },
      { event_id: event.id, full_name: "ביטלו", phone: "972500000015", guest_count: 5, status: "cancelled" },
    ]);
    if (seatError) throw seatError;
  }

  writeFileSync(STATE_FILE, JSON.stringify({ staffPassword, events: Object.fromEntries(events.map((e) => [e.slug, e.id])) }));
}
