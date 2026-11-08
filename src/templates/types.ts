import type { ReactNode } from "react";
import type { PublicEvent } from "@/lib/public-event";

// The pieces every invitation shows. Each template decides how to arrange and
// frame them; the pieces themselves are shared so behaviour stays identical.
export type TemplateParts = {
  media: ReactNode | null;
  countdown: ReactNode;
  info: ReactNode;
  actions: ReactNode;
  description: ReactNode | null;
  registration: ReactNode;
};

export type TemplateProps = {
  event: PublicEvent;
  parts: TemplateParts;
  labels: { invited: string; rsvpTitle: string };
};
