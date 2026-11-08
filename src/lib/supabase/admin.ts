import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { supabaseUrl } from "@/lib/env";

// Bypasses RLS. Server-only, and only for work that has already been
// authorised in code (cron jobs, health checks).
export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing environment variable SUPABASE_SECRET_KEY. See .env.example.");
  }
  return createSupabaseClient<Database>(supabaseUrl(), secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
