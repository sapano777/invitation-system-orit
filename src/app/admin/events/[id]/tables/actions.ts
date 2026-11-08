"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type SeatingResult = { ok: true } | { ok: false; error: "invalid" | "name_taken" | "failed" };

const UNIQUE_VIOLATION = "23505";

function refresh(eventId: string) {
  revalidatePath(`/admin/events/${eventId}/tables`);
  revalidatePath(`/admin/events/${eventId}`);
}

const addSchema = z.object({
  count: z.coerce.number().int().min(1).max(100),
  capacity: z.coerce.number().int().min(1).max(200),
  prefix: z.string().trim().min(1).max(40),
});

// Adds numbered tables ("Table 7", "Table 8", ...), continuing after the
// highest number already used with the same prefix.
export async function addTables(eventId: string, input: { count: number; capacity: number; prefix: string }): Promise<SeatingResult> {
  await requireStaff();
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { count, capacity, prefix } = parsed.data;

  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase.from("event_tables").select("name, sort_order").eq("event_id", eventId);
  if (loadError) return { ok: false, error: "failed" };

  const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} (\\d+)$`);
  const lastNumber = Math.max(0, ...existing.map((t) => Number(pattern.exec(t.name)?.[1] ?? 0)));
  const lastOrder = Math.max(0, ...existing.map((t) => t.sort_order));

  const rows = Array.from({ length: count }, (_, i) => ({
    event_id: eventId,
    name: `${prefix} ${lastNumber + i + 1}`,
    capacity,
    sort_order: lastOrder + i + 1,
  }));
  const { error } = await supabase.from("event_tables").insert(rows);
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { ok: false, error: "name_taken" };
    console.error("addTables failed", error);
    return { ok: false, error: "failed" };
  }
  refresh(eventId);
  return { ok: true };
}

const updateSchema = z.object({
  name: z.string().trim().min(1).max(60),
  capacity: z.coerce.number().int().min(1).max(200),
});

export async function updateTable(eventId: string, tableId: string, input: { name: string; capacity: number }): Promise<SeatingResult> {
  await requireStaff();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { error } = await supabase.from("event_tables").update(parsed.data).eq("id", tableId).eq("event_id", eventId);
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { ok: false, error: "name_taken" };
    console.error("updateTable failed", error);
    return { ok: false, error: "failed" };
  }
  refresh(eventId);
  return { ok: true };
}

// Guests seated at the table go back to "not seated".
export async function deleteTable(eventId: string, tableId: string): Promise<SeatingResult> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("event_tables").delete().eq("id", tableId).eq("event_id", eventId);
  if (error) {
    console.error("deleteTable failed", error);
    return { ok: false, error: "failed" };
  }
  refresh(eventId);
  return { ok: true };
}

// Seats a registration at a table, moves it, or (tableId null) unseats it.
export async function assignSeat(eventId: string, registrationId: string, tableId: string | null): Promise<SeatingResult> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = tableId
    ? await supabase
        .from("registration_tables")
        .upsert({ registration_id: registrationId, event_id: eventId, table_id: tableId, assigned_at: new Date().toISOString() })
    : await supabase.from("registration_tables").delete().eq("registration_id", registrationId).eq("event_id", eventId);
  if (error) {
    console.error("assignSeat failed", error);
    return { ok: false, error: "failed" };
  }
  refresh(eventId);
  return { ok: true };
}
