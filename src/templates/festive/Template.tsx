import type { TemplateProps } from "../types";

const flagColors = ["var(--accent)", "#ffbe0b", "#3a86ff", "#8338ec", "#06d6a0"];

function Bunting() {
  return (
    <svg viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden className="h-12 w-full sm:h-16">
      <path d="M0 6 Q200 34 400 6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
      {Array.from({ length: 11 }, (_, i) => {
        const x = 10 + i * 36;
        const y = 6 + 28 * (1 - ((x - 200) / 200) ** 2) - 1;
        return <path key={i} d={`M${x} ${y} l14 0 l-7 22 z`} fill={flagColors[i % flagColors.length]} />;
      })}
    </svg>
  );
}

function Confetti() {
  const pieces = [
    [3, 6, 18], [14, 94, -30], [26, 4, 45], [72, 95, 12], [95, 8, -20], [86, 92, 35], [5, 90, -10], [60, 3, 60],
  ];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden className="pointer-events-none absolute inset-0 size-full">
      {pieces.map(([x, y, r], i) => (
        <rect key={i} x={x} y={y} width="2.5" height="5" rx="0.5" fill={flagColors[i % flagColors.length]} transform={`rotate(${r} ${x} ${y})`} opacity="0.8" />
      ))}
    </svg>
  );
}

// Festive: bunting, confetti, a bold title on a highlighter stripe.
export function FestiveTemplate({ event, parts, labels }: TemplateProps) {
  return (
    <article className="w-full overflow-x-clip">
      <Bunting />
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 px-5 pb-12 text-center">
        <header className="relative w-full py-6">
          <Confetti />
          <p className="relative font-display text-xl text-accent">{labels.invited}</p>
          <h1 className="relative mt-3 font-display text-5xl leading-tight text-balance sm:text-6xl">
            <span className="box-decoration-clone bg-[linear-gradient(transparent_55%,color-mix(in_srgb,var(--accent)_30%,transparent)_55%)] px-2">
              {event.title}
            </span>
          </h1>
        </header>

        {parts.media && (
          <div className="w-full max-w-sm rotate-2 bg-white p-3 pb-10 shadow-xl">
            <div className="overflow-hidden">{parts.media}</div>
          </div>
        )}

        <div className="w-full rounded-3xl bg-surface p-6 shadow-sm">{parts.info}</div>
        <div className="font-display [&_[role=timer]>div]:border-0 [&_[role=timer]>div]:bg-accent [&_[role=timer]>div]:text-on-accent [&_[role=timer]_span:last-child]:text-on-accent/80">
          {parts.countdown}
        </div>
        {parts.description && <div className="text-lg leading-relaxed">{parts.description}</div>}
        {parts.actions}

        <section className="flex w-full flex-col gap-4" aria-labelledby="rsvp-title">
          <h2 id="rsvp-title" className="font-display text-3xl">{labels.rsvpTitle}</h2>
          <div className="[&_form]:rounded-3xl [&_form]:shadow-sm [&_button[type=submit]]:rounded-full">{parts.registration}</div>
        </section>
      </div>
    </article>
  );
}
