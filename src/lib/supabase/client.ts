import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";

// For Client Components. Acts as the signed-in user, limited by RLS.
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabasePublishableKey());
}
