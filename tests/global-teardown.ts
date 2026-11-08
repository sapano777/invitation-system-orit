import { adminClient, SLUG_PREFIX, STAFF_EMAIL } from "./helpers";

// Removes everything the tests created: e2e- events (registrations and email
// log rows go with them) and the test staff user.
export async function cleanup() {
  const supabase = adminClient();
  await supabase.from("events").delete().like("slug", `${SLUG_PREFIX}%`);
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const user = data?.users.find((u) => u.email === STAFF_EMAIL);
  if (user) await supabase.auth.admin.deleteUser(user.id);
}

export default async function globalTeardown() {
  await cleanup();
}
