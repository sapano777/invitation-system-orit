export const locales = ["he", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "he";

// The locale lives in a cookie rather than the URL, so each event keeps a
// single link that works for guests in either language.
export const LOCALE_COOKIE = "NEXT_LOCALE";

const rtlLocales: ReadonlySet<Locale> = new Set(["he"]);

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return rtlLocales.has(locale) ? "rtl" : "ltr";
}
