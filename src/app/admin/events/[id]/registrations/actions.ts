"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import type { StaffRegistrationErrorKey } from "@/lib/registration/staff-errors";
import { staffRegistrationSchema, toRegistrationColumns } from "@/lib/registration/staff-schema";
import { createClient } from "@/lib/supabase/server";

export type StaffRegistrationState = {
  ok?: boolean;
  fieldErrors?: Partial<Record<string, StaffRegistrationErrorKey>>;
  formError?: StaffRegistrationErrorKey;
};

const UNIQUE_VIOLATION = "23505";

function parse(formData: FormData) {
  const parsed = staffRegistrationSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) return { data: parsed.data } as const;
  const fieldErrors: Record<string, StaffRegistrationErrorKey> = {};
  for (const [field, messages] of Object.entries(z.flattenError(parsed.error).fieldErrors)) {
    // Every message in staffRegistrationSchema is a StaffRegistrationErrorKey.
    if (messages?.[0]) fieldErrors[field] = messages[0] as StaffRegistrationErrorKey;
  }
  return { fieldErrors } as const;
}

export async function createRegistration(eventId: string, _prev: StaffRegistrationState, formData: FormData): Promise<StaffRegistrationState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("fieldErrors" in parsed) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("registrations")
    .insert({ ...toRegistrationColumns(parsed.data), event_id: eventId, source: "manual" });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { fieldErrors: { phone: "phone_exists" } };
    console.error("createRegistration failed", error);
    return { formError: "save_failed" };
  }
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}

export async function updateRegistration(
  eventId: string,
  registrationId: string,
  _prev: StaffRegistrationState,
  formData: FormData,
): Promise<StaffRegistrationState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("fieldErrors" in parsed) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrations")
    .update(toRegistrationColumns(parsed.data))
    .eq("id", registrationId)
    .eq("event_id", eventId)
    .select("id");

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { fieldErrors: { phone: "phone_exists" } };
    console.error("updateRegistration failed", error);
    return { formError: "save_failed" };
  }
  if (!data?.length) return { formError: "not_found" };
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}

export async function deleteRegistration(eventId: string, registrationId: string) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("registrations").delete().eq("id", registrationId).eq("event_id", eventId);
  if (error) {
    console.error("deleteRegistration failed", error);
    throw new Error("delete_failed");
  }
  revalidatePath(`/admin/events/${eventId}`);
}
