import type { TemplateProps } from "../types";

function Sunburst() {
  return (
    <svg viewBox="0 0 120 60" aria-hidden className="h-12 w-28 text-accent">
      {Array.from({ length: 13 }, (_, i) => {
        const angle = Math.PI - (i * Math.PI) / 12;
        return (
          <line
            key={i}
            x1="60"
            y1="58"
            x2={60 + Math.cos(angle) * (i % 2 ? 40 : 55)}
            y2={58 - Math.sin(angle) * (i % 2 ? 40 : 55)}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}

function Diamond({ className }: { className: string }) {
  return <span aria-hidden className={`absolute size-3 rotate-45 bg-accent ${className}`} />;
}

const goldText = {
  backgroundImage: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 45%, white), var(--accent) 60%, color-mix(in srgb, var(--accent) 70%, black))",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
} as const;

// Gold: dark, art-deco frame, gold gradient title.
export function GoldTemplate({ event, parts, labels }: TemplateProps) {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <div className="relative border border-accent/70 p-1.5">
        <Diamond className="-start-1.5 -top-1.5" />
        <Diamond className="-end-1.5 -top-1.5" />
        <Diamond className="-bottom-1.5 -start-1.5" />
        <Diamond className="-bottom-1.5 -end-1.5" />
        <div className="flex flex-col items-center gap-8 border-4 border-double border-accent/70 px-5 py-10 text-center sm:px-10">
          <Sunburst />
          <p className="text-sm tracking-wide ltr:tracking-[0.35em] text-accent">{labels.invited}</p>
          <h1 className="font-deco text-4xl leading-tight text-balance sm:text-6xl" style={goldText}>
            {event.title}
          </h1>

          {parts.media && (
            <div className="w-full max-w-md border border-accent p-2">
              <div className="overflow-hidden outline outline-1 outline-offset-4 outline-accent/50">{parts.media}</div>
            </div>
          )}

          <div className="w-full max-w-sm divide-y divide-accent/30 [&_dl]:gap-0 [&_dl>div]:border-b [&_dl>div]:border-accent/30 [&_dl>div]:py-3 [&_dl>div:last-child]:border-0">
            {parts.info}
          </div>
          <div className="[&_[role=timer]>div]:rounded-none [&_[role=timer]>div]:border-accent/60 [&_[role=timer]>div]:bg-transparent [&_[role=timer]_span:first-child]:text-accent">
            {parts.countdown}
          </div>
          {parts.description && <div className="max-w-md leading-relaxed text-muted">{parts.description}</div>}
          <div className="[&_a]:rounded-none">{parts.actions}</div>

          <section className="flex w-full flex-col gap-4" aria-labelledby="rsvp-title">
            <h2 id="rsvp-title" className="font-deco text-3xl" style={goldText}>
              {labels.rsvpTitle}
            </h2>
            <div className="[&_form]:rounded-none [&_form]:border-accent/40 [&_button[type=submit]]:rounded-none">{parts.registration}</div>
          </section>
        </div>
      </div>
    </article>
  );
}
