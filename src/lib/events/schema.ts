import { z } from "zod";
import { isLocalDateTime, zonedInputToIso } from "@/lib/dates";
import { templateIds } from "@/templates/registry";
import { SLUG_PATTERN } from "./slug";

// Error messages are translation keys under "eventForm.errors".

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optional = <T extends z.ZodType>(schema: T) => z.preprocess(blankToUndefined, schema.optional());

const text = (max: number) => z.string().trim().max(max, { error: "too_long" });

const httpUrl = z
  .string()
  .trim()
  .max(2000, { error: "too_long" })
  .refine((v) => {
    try {
      return ["http:", "https:"].includes(new URL(v).protocol);
    } catch {
      return false;
    }
  }, { error: "invalid_url" });

const localDateTime = z.string().refine(isLocalDateTime, { error: "invalid_date" });

const coordinate = (min: number, max: number) =>
  z.coerce.number({ error: "invalid_coordinates" }).min(min, { error: "invalid_coordinates" }).max(max, { error: "invalid_coordinates" });

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, { error: "required" }).max(200, { error: "too_long" }),
    event_type: z.enum(["private", "business"], { error: "required" }),
    description: optional(text(5000)),
    date_time: z.preprocess(blankToUndefined, localDateTime.optional()).refine((v) => v !== undefined, { error: "required" }),
    venue_name: optional(text(200)),
    address: optional(text(300)),
    lat: optional(coordinate(-90, 90)),
    lng: optional(coordinate(-180, 180)),
    template_id: z.enum(templateIds, { error: "required" }),
    media_url: optional(httpUrl),
    primary_color: optional(z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "invalid_color" })),
    gift_link_url: optional(httpUrl),
    rsvp_deadline: optional(localDateTime),
    // Empty = no automatic reminder.
    reminder_offset_hours: optional(z.coerce.number({ error: "invalid_number" }).int({ error: "invalid_number" }).min(1, { error: "invalid_number" }).max(24 * 60, { error: "invalid_number" })),
    max_guests: optional(z.coerce.number({ error: "invalid_number" }).int({ error: "invalid_number" }).min(1, { error: "invalid_number" }).max(100000, { error: "invalid_number" })),
    is_active: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
    slug: optional(z.string().trim().toLowerCase().regex(SLUG_PATTERN, { error: "invalid_slug" })),
  })
  .check((ctx) => {
    const v = ctx.value;
    if ((v.lat === undefined) !== (v.lng === undefined)) {
      ctx.issues.push({ code: "custom", input: v.lat, path: ["lat"], message: "invalid_coordinates" });
    }
    if (v.rsvp_deadline && v.date_time && v.rsvp_deadline > v.date_time) {
      ctx.issues.push({ code: "custom", input: v.rsvp_deadline, path: ["rsvp_deadline"], message: "deadline_after_event" });
    }
  });

export type EventFormInput = z.infer<typeof eventFormSchema>;

// Converts validated form input into the shape stored in the events table.
export function toEventColumns(input: EventFormInput) {
  return {
    title: input.title,
    event_type: input.event_type,
    description: input.description ?? null,
    date_time: zonedInputToIso(input.date_time!)!,
    venue_name: input.venue_name ?? null,
    address: input.address ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    template_id: input.template_id,
    media_url: input.media_url ?? null,
    primary_color: input.primary_color?.toLowerCase() ?? null,
    gift_link_url: input.gift_link_url ?? null,
    rsvp_deadline: input.rsvp_deadline ? zonedInputToIso(input.rsvp_deadline) : null,
    max_guests: input.max_guests ?? null,
    reminder_offset_hours: input.reminder_offset_hours ?? null,
    is_active: input.is_active,
  };
}
