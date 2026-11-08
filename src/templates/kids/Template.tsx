import type { CSSProperties } from "react";
import type { TemplateProps } from "../types";

const confetti: CSSProperties = {
  backgroundImage: [
    "radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--accent) 55%, transparent) 0 6px, transparent 7px)",
    "radial-gradient(circle at 85% 12%, #4cc9f0aa 0 5px, transparent 6px)",
    "radial-gradient(circle at 70% 70%, #ffd166cc 0 7px, transparent 8px)",
    "radial-gradient(circle at 25% 80%, #8ac926aa 0 5px, transparent 6px)",
    "radial-gradient(circle at 50% 40%, #b388ebaa 0 4px, transparent 5px)",
  ].join(","),
  backgroundSize: "220px 220px",
};

function Balloon({ color, className }: { color: string; className: string }) {
  return (
    <svg viewBox="0 0 40 70" aria-hidden className={className}>
      <ellipse cx="20" cy="20" rx="16" ry="19" fill={color} />
      <path d="M18 39 l2 4 l2 -4 z" fill={color} />
      <path d="M20 43 q-4 10 0 14 q4 4 0 13" stroke={color} strokeWidth="1.2" fill="none" />
    </svg>
  );
}

// Kids: confetti background, balloons, rounded letters, a tilted photo.
export function KidsTemplate({ event, parts, labels }: TemplateProps) {
  return (
    <article className="relative w-full overflow-x-clip" style={confetti}>
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 px-5 py-10 text-center">
        <div className="relative w-full">
          <Balloon color="var(--accent)" className="absolute -start-1 -top-2 h-24 w-14 -rotate-12" />
          <Balloon color="#4cc9f0" className="absolute -end-1 top-4 h-20 w-12 rotate-12" />
          <p className="font-rounded text-lg text-accent">{labels.invited}</p>
          <h1
            className="mx-auto mt-2 max-w-[85%] font-rounded text-5xl leading-tight text-balance sm:text-6xl"
            style={{ textShadow: "3px 3px 0 color-mix(in srgb, var(--accent) 35%, transparent)" }}
          >
            {event.title}
          </h1>
        </div>

        {parts.media && (
          <div className="w-full max-w-sm -rotate-2 rounded-3xl border-8 border-white bg-white shadow-xl">
            <div className="overflow-hidden rounded-2xl">{parts.media}</div>
          </div>
        )}

        <div className="w-full rounded-[2rem] border-4 border-dashed border-accent/50 bg-surface p-6 font-rounded">{parts.info}</div>
        <div className="font-rounded [&_[role=timer]>div]:rounded-2xl [&_[role=timer]>div]:border-2 [&_[role=timer]>div]:border-accent [&_[role=timer]>div:nth-child(odd)]:rotate-3 [&_[role=timer]>div:nth-child(even)]:-rotate-3">
          {parts.countdown}
        </div>
        {parts.description && <div className="font-rounded text-lg leading-relaxed">{parts.description}</div>}
        <div className="font-rounded">{parts.actions}</div>

        <section className="flex w-full flex-col gap-4" aria-labelledby="rsvp-title">
          <h2 id="rsvp-title" className="font-rounded text-3xl text-accent">{labels.rsvpTitle}</h2>
          <div className="[&_form]:rounded-[2rem] [&_form]:border-4 [&_form]:border-accent/30 [&_button[type=submit]]:rounded-full">{parts.registration}</div>
        </section>
      </div>
    </article>
  );
}
