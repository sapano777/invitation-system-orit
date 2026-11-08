"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { supabaseUrl } from "@/lib/env";
import type { EventErrorKey } from "@/lib/events/errors";
import { eventFormSchema, toEventColumns } from "@/lib/events/schema";
import { generateSlug } from "@/lib/events/slug";
import { MEDIA_BUCKET, mediaPathFromUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export type EventFormState = {
  fieldErrors?: Partial<Record<string, EventErrorKey>>;
  formError?: "save_failed" | "not_found";
};

const UNIQUE_VIOLATION = "23505";

function parseForm(formData: FormData) {
  const parsed = eventFormSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) return { data: parsed.data } as const;

  const { fieldErrors } = z.flattenError(parsed.error);
  const firstErrors: Record<string, EventErrorKey> = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    // Every message in eventFormSchema is an EventErrorKey.
    if (messages?.[0]) firstErrors[field] = messages[0] as EventErrorKey;
  }
  return { errors: firstErrors } as const;
}

// Only accept media that lives in our own bucket.
function checkMediaUrl(url: string | undefined) {
  return !url || mediaPathFromUrl(url, supabaseUrl()) !== null;
}

export async function createEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  await requireStaff();
  const parsed = parseForm(formData);
  if ("errors" in parsed) return { fieldErrors: parsed.errors };
  const input = parsed.data;
  if (!checkMediaUrl(input.media_url)) return { fieldErrors: { media_url: "invalid_url" } };

  const supabase = await createClient();
  const columns = toEventColumns(input);

  // A generated slug can (rarely) collide; try a few times. A slug the user
  // typed is reported back instead.
  let createdId: string | null = null;
  for (let attempt = 0; attempt < 3 && !createdId; attempt++) {
    const slug = input.slug ?? generateSlug(input.title);
    const { data, error } = await supabase.from("events").insert({ ...columns, slug }).select("id").single();
    if (data) {
      createdId = data.id;
    } else if (error?.code === UNIQUE_VIOLATION) {
      if (input.slug) return { fieldErrors: { slug: "slug_taken" } };
    } else {
      console.error("createEvent failed", error);
      return { formError: "save_failed" };
    }
  }
  if (!createdId) return { formError: "save_failed" };

  revalidatePath("/admin");
  redirect(`/admin/events/${createdId}`);
}

export async function updateEvent(eventId: string, _prev: EventFormState, formData: FormData): Promise<EventFormState> {
  await requireStaff();
  const parsed = parseForm(formData);
  if ("errors" in parsed) return { fieldErrors: parsed.errors };
  const input = parsed.data;
  if (!checkMediaUrl(input.media_url)) return { fieldErrors: { media_url: "invalid_url" } };

  const supabase = await createClient();
  const { data: before } = await supabase.from("events").select("media_url").eq("id", eventId).maybeSingle();
  if (!before) return { formError: "not_found" };

  // The slug is fixed once created: the link may already be shared.
  const { error } = await supabase.from("events").update(toEventColumns(input)).eq("id", eventId);
  if (error) {
    console.error("updateEvent failed", error);
    return { formError: "save_failed" };
  }

  if (before.media_url && before.media_url !== (input.media_url ?? null)) {
    await removeMedia(supabase, before.media_url);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/events/${eventId}`);
  redirect(`/admin/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("media_url").eq("id", eventId).maybeSingle();

  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) {
    console.error("deleteEvent failed", error);
    throw new Error("delete_failed");
  }
  if (event?.media_url) await removeMedia(supabase, event.media_url);

  revalidatePath("/admin");
  redirect("/admin");
}

// Best effort: an orphaned file is harmless, so failures are only logged.
async function removeMedia(supabase: Awaited<ReturnType<typeof createClient>>, url: string) {
  const path = mediaPathFromUrl(url, supabaseUrl());
  if (!path) return;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) console.error("removeMedia failed", error);
}

export type GeocodeResult = { lat: number; lng: number; label: string } | { error: "not_found" | "unavailable" };

// Address -> coordinates via OpenStreetMap Nominatim (free, no API key).
// Called only from the button in the event form, well within its usage policy
// of at most one request per second.
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  await requireStaff();
  const query = address.trim().slice(0, 300);
  if (!query) return { error: "not_found" };

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "il");

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "invitation-system-orit/0.1 (+https://github.com/sapano777/invitation-system-orit)",
        "Accept-Language": "he,en",
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return { error: "unavailable" };
    const results = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const first = results[0];
    if (!first) return { error: "not_found" };
    return { lat: Number(first.lat), lng: Number(first.lon), label: first.display_name };
  } catch {
    return { error: "unavailable" };
  }
}
