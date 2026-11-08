import { ClassicTemplate } from "./classic/Template";
import { CorporateTemplate } from "./corporate/Template";
import { FestiveTemplate } from "./festive/Template";
import { FloralTemplate } from "./floral/Template";
import { GoldTemplate } from "./gold/Template";
import { KidsTemplate } from "./kids/Template";
import { MidnightTemplate } from "./midnight/Template";
import { MinimalTemplate } from "./minimal/Template";
import type { TemplateId } from "./registry";
import { RomanticTemplate } from "./romantic/Template";
import { TechTemplate } from "./tech/Template";
import type { TemplateProps } from "./types";

// Renders the layout for a template.
export function InvitationTemplate({ id, ...props }: TemplateProps & { id: TemplateId }) {
  switch (id) {
    case "classic":
      return <ClassicTemplate {...props} />;
    case "minimal":
      return <MinimalTemplate {...props} />;
    case "floral":
      return <FloralTemplate {...props} />;
    case "midnight":
      return <MidnightTemplate {...props} />;
    case "gold":
      return <GoldTemplate {...props} />;
    case "kids":
      return <KidsTemplate {...props} />;
    case "corporate":
      return <CorporateTemplate {...props} />;
    case "tech":
      return <TechTemplate {...props} />;
    case "festive":
      return <FestiveTemplate {...props} />;
    case "romantic":
      return <RomanticTemplate {...props} />;
  }
}
