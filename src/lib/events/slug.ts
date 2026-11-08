// Public links look like /e/<slug>. Slugs are lowercase latin letters,
// digits and dashes (matches the check constraint on events.slug).

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{2,63}$/;

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no look-alikes (l/1, o/0)

function randomPart(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

// Hebrew titles have no latin letters, so those get a short random slug.
// The random part also keeps links hard to guess.
export function generateSlug(title: string) {
  const base = slugify(title);
  return base.length >= 3 ? `${base}-${randomPart(5)}` : randomPart(8);
}
