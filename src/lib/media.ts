// Shared rules for invitation media, used by the upload widget and the server.

export const MEDIA_BUCKET = "event-media";
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
export const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export function mediaPublicPrefix(supabaseUrl: string) {
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/`;
}

// The object path inside the bucket, or null if the URL is not ours.
export function mediaPathFromUrl(url: string, supabaseUrl: string) {
  const prefix = mediaPublicPrefix(supabaseUrl);
  return url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null;
}
