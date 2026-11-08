import type { CSSProperties } from "react";
import { isDark, readableOn } from "@/lib/color";
import { defaultTemplateId, isTemplateId, templates, type TemplateId } from "./registry";

// A template's palette becomes the app's colour variables on the invitation
// wrapper, so shared components (buttons, inputs) follow the design without
// knowing which template they're in.
export function buildTheme(templateId: string, primaryColor: string | null) {
  const id: TemplateId = isTemplateId(templateId) ? templateId : defaultTemplateId;
  const { palette } = templates[id];
  const accent = primaryColor ?? palette.accent;
  const dark = isDark(palette.background);

  const style = {
    "--background": palette.background,
    "--surface": palette.surface,
    "--foreground": palette.text,
    "--muted": palette.muted,
    "--border": `color-mix(in srgb, ${palette.text} 14%, transparent)`,
    "--accent": accent,
    "--on-accent": readableOn(accent),
    colorScheme: dark ? "dark" : "light",
  } as CSSProperties;

  return { id, style, dark };
}
