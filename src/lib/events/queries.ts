import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// One event for the admin pages. RLS limits this to staff; a non-staff
// caller simply gets null.
export const getEvent = cache(async (id: string) => {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  return data;
});

export const getRegistrations = cache(async (eventId: string) => {
  if (!UUID.test(eventId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getRegistrations failed", error);
    throw new Error("registrations_load_failed");
  }
  return data;
});

export function summarize(registrations: Array<{ status: string; guest_count: number; email: string | null }>) {
  const confirmed = registrations.filter((r) => r.status === "confirmed");
  return {
    registrations: confirmed.length,
    guests: confirmed.reduce((sum, r) => sum + r.guest_count, 0),
    withEmail: confirmed.filter((r) => r.email).length,
    cancelled: registrations.length - confirmed.length,
  };
}
