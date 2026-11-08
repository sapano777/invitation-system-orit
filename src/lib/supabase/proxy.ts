import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";
import { hasSupabaseEnv, supabasePublishableKey, supabaseUrl } from "@/lib/env";

// Refreshes the Supabase session cookie on each request and sends signed-out
// visitors of /admin to the login page. This is an optimistic check only: the
// staff check against the database happens in requireStaff().
export async function updateSession(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");

  if (!hasSupabaseEnv()) {
    return isAdmin ? redirectToLogin(request) : NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

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
  const { data } = await supabase.auth.getClaims();

  if (isAdmin && !data?.claims?.sub) {
    const redirect = redirectToLogin(request);
    // Keep any cookie changes (e.g. a cleared, expired session).
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}
