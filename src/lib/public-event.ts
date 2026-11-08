import "server-only";
import { cache } from "react";
import { hasSupabaseEnv } from "@/lib/env";
import { SLUG_PATTERN } from "@/lib/events/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

export type PublicEvent = Database["public"]["Functions"]["get_public_event"]["Returns"][number];

// The event as guests see it: public fields only, via a security-definer
// function, so the invitation page never reads the tables directly.
export const getPublicEvent = cache(async (slug: string): Promise<PublicEvent | null> => {
  if (!SLUG_PATTERN.test(slug) || !hasSupabaseEnv()) return null;
  const { data, error } = await createAdminClient().rpc("get_public_event", { p_slug: slug });
  if (error) {
    console.error("get_public_event failed", error);
    throw new Error("event_load_failed");
  }
  return data?.[0] ?? null;
});

export type RegistrationAvailability =
  | { open: true; spotsLeft: number | null }
  | { open: false; reason: "closed" | "deadline_passed" | "full" };

export function registrationAvailability(event: PublicEvent, now: number): RegistrationAvailability {
  if (!event.is_active || new Date(event.date_time).getTime() < now) return { open: false, reason: "closed" };
  if (event.rsvp_deadline && new Date(event.rsvp_deadline).getTime() < now) return { open: false, reason: "deadline_passed" };
  if (event.max_guests !== null) {
    const spotsLeft = Math.max(event.max_guests - event.guests_taken, 0);
    return spotsLeft === 0 ? { open: false, reason: "full" } : { open: true, spotsLeft };
  }
  return { open: true, spotsLeft: null };
}
