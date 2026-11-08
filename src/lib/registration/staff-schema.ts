import { z } from "zod";
import { blankToUndefined, phoneField } from "./schema";

// Registrations added or edited by staff. Error messages are keys under
// "registrations.errors". Unlike guests, staff may exceed the event's
// capacity and may cancel a registration.

export const staffRegistrationSchema = z.object({
  full_name: z.string().trim().min(1, { error: "name_required" }).max(120, { error: "too_long" }),
  phone: phoneField,
  email: z.preprocess(blankToUndefined, z.string().trim().toLowerCase().pipe(z.email({ error: "invalid_email" })).optional()),
  guest_count: z.coerce
    .number({ error: "invalid_guest_count" })
    .int({ error: "invalid_guest_count" })
    .min(1, { error: "invalid_guest_count" })
    .max(50, { error: "invalid_guest_count" }),
  // One name per line.
  guest_names: z
    .string()
    .default("")
    .transform((v) => v.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))
    .pipe(z.array(z.string().max(120, { error: "too_long" })).max(50, { error: "too_long" })),
  notes: z.preprocess(blankToUndefined, z.string().trim().max(1000, { error: "too_long" }).optional()),
  status: z.enum(["confirmed", "cancelled"]).default("confirmed"),
});

export type StaffRegistrationInput = z.infer<typeof staffRegistrationSchema>;

export function toRegistrationColumns(input: StaffRegistrationInput) {
  return {
    full_name: input.full_name,
    phone: input.phone,
    email: input.email ?? null,
    guest_count: input.guest_count,
    guest_names: input.guest_names,
    notes: input.notes ?? null,
    status: input.status,
  };
}
