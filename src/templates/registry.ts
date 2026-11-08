// The 10 invitation designs: identity, palette and heading font. Layouts live
// in each template's folder (see InvitationTemplate.tsx).

export const templateIds = [
  "classic",
  "minimal",
  "floral",
  "midnight",
  "gold",
  "kids",
  "corporate",
  "tech",
  "festive",
  "romantic",
] as const;

export type TemplateId = (typeof templateIds)[number];

export type TemplatePalette = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
};

export type TemplateMeta = {
  id: TemplateId;
  palette: TemplatePalette;
  // CSS font-family for headings (variables come from templates/fonts.ts).
  headingFont: string;
  // Which kind of event the design suits best. Purely a hint for sorting.
  suits: "private" | "business" | "any";
};

export const templates: Record<TemplateId, TemplateMeta> = {
  classic: {
    id: "classic",
    palette: { background: "#f8f5ef", surface: "#ffffff", text: "#2b2622", muted: "#7a6f64", accent: "#8b6b3f" },
    headingFont: "var(--font-frank-ruhl), Georgia, serif",
    suits: "private",
  },
  minimal: {
    id: "minimal",
    palette: { background: "#ffffff", surface: "#f4f4f5", text: "#18181b", muted: "#71717a", accent: "#18181b" },
    headingFont: "var(--font-assistant), sans-serif",
    suits: "any",
  },
  floral: {
    id: "floral",
    palette: { background: "#fbf3f1", surface: "#ffffff", text: "#3f2a2e", muted: "#8d6e73", accent: "#c26d7e" },
    headingFont: "var(--font-amatic), sans-serif",
    suits: "private",
  },
  midnight: {
    id: "midnight",
    palette: { background: "#0f1222", surface: "#1a1f36", text: "#eef0fb", muted: "#9aa1c4", accent: "#7c8cff" },
    headingFont: "var(--font-heebo), sans-serif",
    suits: "any",
  },
  gold: {
    id: "gold",
    palette: { background: "#14110c", surface: "#211c13", text: "#f6efe0", muted: "#bfae8a", accent: "#d4af37" },
    headingFont: "var(--font-suez), Georgia, serif",
    suits: "private",
  },
  kids: {
    id: "kids",
    palette: { background: "#fff8e6", surface: "#ffffff", text: "#2d2a4a", muted: "#6b6890", accent: "#ff6b4a" },
    headingFont: "var(--font-varela), sans-serif",
    suits: "private",
  },
  corporate: {
    id: "corporate",
    palette: { background: "#f5f7fa", surface: "#ffffff", text: "#102a43", muted: "#627d98", accent: "#1f5fbf" },
    headingFont: "var(--font-heebo), sans-serif",
    suits: "business",
  },
  tech: {
    id: "tech",
    palette: { background: "#0b0f14", surface: "#121922", text: "#e6edf3", muted: "#8b98a5", accent: "#2ee6a6" },
    headingFont: "var(--font-rubik), sans-serif",
    suits: "business",
  },
  festive: {
    id: "festive",
    palette: { background: "#fff4f8", surface: "#ffffff", text: "#2a1740", muted: "#7a6690", accent: "#e0218a" },
    headingFont: "var(--font-secular), sans-serif",
    suits: "any",
  },
  romantic: {
    id: "romantic",
    palette: { background: "#f6f0f5", surface: "#fffafd", text: "#3b2236", muted: "#8a6b83", accent: "#a1477f" },
    headingFont: "var(--font-bellefair), Georgia, serif",
    suits: "private",
  },
};

export const defaultTemplateId: TemplateId = "classic";

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && (templateIds as readonly string[]).includes(value);
}
