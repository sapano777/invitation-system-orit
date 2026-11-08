"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { MEDIA_BUCKET, MEDIA_MAX_BYTES, MEDIA_TYPES } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";

const extensions: Record<(typeof MEDIA_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type Props = {
  value: string;
  onChange: (url: string) => void;
  error?: string;
};

// Uploads straight from the browser to Supabase Storage (staff-only by RLS),
// so large GIFs don't pass through a Server Action's body limit.
export function MediaUpload({ value, onChange, error }: Props) {
  const t = useTranslations("media");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading">("idle");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLocalError(null);
    if (!(MEDIA_TYPES as readonly string[]).includes(file.type)) {
      setLocalError(t("errors.type"));
      return;
    }
    if (file.size > MEDIA_MAX_BYTES) {
      setLocalError(t("errors.size"));
      return;
    }

    setStatus("uploading");
    const ext = extensions[file.type as (typeof MEDIA_TYPES)[number]];
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    setStatus("idle");

    if (uploadError) {
      console.error(uploadError);
      setLocalError(t("errors.upload"));
      return;
    }
    onChange(supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl);
  }

  const shownError = localError ?? (error ? t("errors.upload") : null);

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="media_url" value={value} />
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={MEDIA_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      {value ? (
        <div className="flex flex-wrap items-end gap-4">
          {/* Plain <img>: GIFs must stay animated, so no image optimisation. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={t("previewAlt")} className="max-h-48 rounded-lg border border-border object-contain" />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled={status === "uploading"} onClick={() => inputRef.current?.click()}>
              {t("replace")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => onChange("")}>
              {t("remove")}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "uploading"}
          className="flex flex-col items-center gap-1 rounded-xl border-2 border-dashed border-border px-4 py-8 text-sm text-muted transition-colors hover:border-accent hover:text-foreground disabled:opacity-60"
        >
          <span className="font-medium">{status === "uploading" ? t("uploading") : t("choose")}</span>
          <span className="text-xs">{t("hint")}</span>
        </button>
      )}

      {status === "uploading" && value && <p className="text-sm text-muted" role="status">{t("uploading")}</p>}
      {shownError && <p className="text-xs text-red-600" role="alert">{shownError}</p>}
    </div>
  );
}
