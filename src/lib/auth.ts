import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

type AuthState =
  | { status: "anonymous" }
  | { status: "not_staff"; email: string | null }
  | { status: "staff"; user: StaffUser };

// Data access layer for authorisation. The proxy only does an optimistic
// cookie check; every admin page and Server Action calls requireStaff() to
// verify the token and the staff membership against the database.
export const getAuthState = cache(async (): Promise<AuthState> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return { status: "anonymous" };

  const email = typeof claims.email === "string" ? claims.email : null;

  // RLS lets only staff read the staff table, so no row means "not staff".
  const { data: staff } = await supabase
    .from("staff")
    .select("display_name")
    .eq("user_id", claims.sub)
    .maybeSingle();
  if (!staff) return { status: "not_staff", email };

  return { status: "staff", user: { id: claims.sub, email, displayName: staff.display_name } };
});

export async function requireStaff(): Promise<StaffUser> {
  const state = await getAuthState();
  if (state.status === "anonymous") redirect("/login");
  if (state.status === "not_staff") redirect("/no-access");
  return state.user;
}
