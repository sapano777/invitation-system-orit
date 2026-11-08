"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import type { RegistrationErrorKey } from "@/lib/registration/errors";
import { registrationFromFormData, registrationSchema } from "@/lib/registration/schema";
import { createAdminClient } from "@/lib/supabase/admin";

export type RegistrationState = {
  status?: "created" | "updated";
  name?: string;
  guestCount?: number;
  fieldErrors?: Partial<Record<string, RegistrationErrorKey>>;
  formError?: RegistrationErrorKey;
  spotsLeft?: number;
};

const RATE_LIMIT = 8; // submissions
const RATE_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes per IP

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function registerGuest(slug: string, _prev: RegistrationState, formData: FormData): Promise<RegistrationState> {
  // Honeypot: a hidden field people never fill in. Bots that do get a fake success.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "created", name: String(formData.get("full_name") ?? ""), guestCount: 1 };
  }

  const parsed = registrationSchema.safeParse(registrationFromFormData(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, RegistrationErrorKey> = {};
    for (const [field, messages] of Object.entries(z.flattenError(parsed.error).fieldErrors)) {
      // Every message in registrationSchema is a RegistrationErrorKey.
      if (messages?.[0]) fieldErrors[field] = messages[0] as RegistrationErrorKey;
    }
    return { fieldErrors };
  }

  if (!rateLimit(`register:${await clientIp()}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return { formError: "rate_limited" };
  }
  if (!hasSupabaseEnv()) return { formError: "failed" };

  const input = parsed.data;
  const { data, error } = await createAdminClient().rpc("register_guest", {
    p_slug: slug,
    p_full_name: input.full_name,
    p_phone: input.phone,
    p_email: input.email ?? null,
    p_guest_count: input.guest_count,
    p_guest_names: input.guest_names,
    p_notes: input.notes ?? null,
    // The guest's page language, for their reminder email.
    p_locale: await getLocale(),
  });

  if (error) {
    console.error("register_guest failed", error);
    return { formError: "failed" };
  }

  const result = data as { status?: "created" | "updated"; error?: "not_found" | "closed" | "deadline_passed" | "full"; spots_left?: number };
  if (result.error) {
    return {
      formError: result.error === "not_found" ? "closed" : result.error,
      spotsLeft: result.spots_left,
    };
  }
  return { status: result.status, name: input.full_name, guestCount: input.guest_count };
}
