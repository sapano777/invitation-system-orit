"use client";

import { useTranslations } from "next-intl";
import { templateIds, templates, type TemplateId, type TemplateMeta } from "@/templates/registry";

const headingFonts: Record<TemplateMeta["headingFont"], string> = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "var(--font-sans)",
  rounded: "'Trebuchet MS', 'Arial Rounded MT Bold', var(--font-sans)",
  mono: "ui-monospace, 'SFMono-Regular', Menlo, monospace",
};

type Props = {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
};

// A gallery of the 10 designs. Each card is a miniature of the invitation
// drawn from the template's palette, so it needs no preview images.
export function TemplatePicker({ value, onChange }: Props) {
  const t = useTranslations("templates");

  return (
    <fieldset>
      <legend className="sr-only">{t("legend")}</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {templateIds.map((id) => {
          const { palette, headingFont } = templates[id];
          const selected = id === value;
          return (
            <label
              key={id}
              className={`group cursor-pointer rounded-xl border-2 p-1.5 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent ${
                selected ? "border-accent" : "border-transparent hover:border-border"
              }`}
            >
              <input
                type="radio"
                name="template_id"
                value={id}
                checked={selected}
                onChange={() => onChange(id)}
                className="sr-only"
              />
              <div
                aria-hidden
                className="flex aspect-[3/4] flex-col items-center gap-1.5 overflow-hidden rounded-lg p-2 shadow-sm"
                style={{ background: palette.background, color: palette.text }}
              >
                <div className="h-2/5 w-full rounded-md" style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.muted})`, opacity: 0.85 }} />
                <div className="mt-1 text-sm font-bold leading-tight" style={{ fontFamily: headingFonts[headingFont] }}>
                  {t("sampleTitle")}
                </div>
                <div className="h-1 w-3/4 rounded-full" style={{ background: palette.muted, opacity: 0.5 }} />
                <div className="h-1 w-1/2 rounded-full" style={{ background: palette.muted, opacity: 0.5 }} />
                <div className="mt-auto w-3/4 rounded-full py-1 text-center text-[10px] font-semibold" style={{ background: palette.accent, color: palette.surface }}>
                  {t("sampleButton")}
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-1 text-sm">
                {selected && <span aria-hidden className="text-accent">✓</span>}
                <span className={selected ? "font-semibold" : ""}>{t(`names.${id}`)}</span>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
