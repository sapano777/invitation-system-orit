// registrations.guest_names is a JSON array of strings.
export function guestNamesList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
