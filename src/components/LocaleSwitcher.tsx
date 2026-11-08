"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { locales } from "@/i18n/config";

export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div role="group" aria-label={t("label")} className="inline-flex rounded-full border border-border p-0.5 text-sm">
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={active}
            disabled={pending || active}
            onClick={() =>
              startTransition(async () => {
                await setLocale(locale);
                router.refresh();
              })
            }
            className={
              active
                ? "rounded-full bg-foreground px-3 py-1 text-background"
                : "rounded-full px-3 py-1 text-muted hover:text-foreground disabled:opacity-60"
            }
          >
            {t(locale)}
          </button>
        );
      })}
    </div>
  );
}
