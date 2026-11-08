import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";
import { hasSupabaseEnv, supabasePublishableKey, supabaseUrl } from "@/lib/env";

// Refreshes the Supabase session cookie on each request so Server Components
// see a valid session. Route protection for /admin is added in stage 1.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Let the app boot before Supabase is configured.
  if (!hasSupabaseEnv()) return response;

  const supabase = createServerClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Do not put code between createServerClient and getClaims(): it is what
  // refreshes an expired token.
  await supabase.auth.getClaims();

  return response;
}
