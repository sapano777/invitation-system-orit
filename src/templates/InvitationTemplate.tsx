import { ClassicTemplate } from "./classic/Template";
import { CorporateTemplate } from "./corporate/Template";
import { MidnightTemplate } from "./midnight/Template";
import type { TemplateId } from "./registry";
import type { TemplateProps } from "./types";

// Renders the layout for a template. Designs without their own layout yet
// (stage 5) use the closest existing one, in their own colours.
export function InvitationTemplate({ id, ...props }: TemplateProps & { id: TemplateId }) {
  switch (id) {
    case "midnight":
    case "tech":
      return <MidnightTemplate {...props} />;
    case "corporate":
    case "minimal":
      return <CorporateTemplate {...props} />;
    case "classic":
    case "floral":
    case "gold":
    case "kids":
    case "festive":
    case "romantic":
      return <ClassicTemplate {...props} />;
  }
}
