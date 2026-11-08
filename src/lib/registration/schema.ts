import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

// Error messages are keys under "registration.errors".

import { MAX_GUESTS_PER_REGISTRATION } from "./limits";

export { MAX_GUESTS_PER_REGISTRATION };

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const registrationSchema = z
  .object({
    full_name: z.string().trim().min(2, { error: "name_required" }).max(120, { error: "too_long" }),
    phone: z
      .string()
      .transform((v, ctx) => {
        const phone = normalizePhone(v);
        if (!phone) {
          ctx.issues.push({ code: "custom", input: v, message: "invalid_phone" });
          return z.NEVER;
        }
        return phone;
      }),
    email: z.preprocess(blankToUndefined, z.string().trim().toLowerCase().pipe(z.email({ error: "invalid_email" })).optional()),
    guest_count: z.coerce
      .number({ error: "invalid_guest_count" })
      .int({ error: "invalid_guest_count" })
      .min(1, { error: "invalid_guest_count" })
      .max(MAX_GUESTS_PER_REGISTRATION, { error: "invalid_guest_count" }),
    guest_names: z.array(z.string().trim().max(120, { error: "too_long" })).max(MAX_GUESTS_PER_REGISTRATION),
    notes: z.preprocess(blankToUndefined, z.string().trim().max(1000, { error: "too_long" }).optional()),
  })
  // Keep only the names for the guests actually coming, drop empty ones.
  .transform((v) => ({ ...v, guest_names: v.guest_names.slice(0, v.guest_count).filter(Boolean) }));

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function registrationFromFormData(formData: FormData) {
  return {
    full_name: formData.get("full_name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    guest_count: formData.get("guest_count") ?? "1",
    guest_names: formData.getAll("guest_names").map(String),
    notes: formData.get("notes") ?? "",
  };
}
