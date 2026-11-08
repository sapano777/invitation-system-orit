import type { TemplateProps } from "../types";

function Flower({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse key={deg} cx="50" cy="28" rx="14" ry="24" fill="currentColor" opacity="0.55" transform={`rotate(${deg} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="10" fill="currentColor" />
    </svg>
  );
}

function Leaves() {
  return (
    <svg viewBox="0 0 160 24" aria-hidden className="h-6 w-40 text-accent">
      <path d="M0 12 H160" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      {[30, 55, 105, 130].map((x, i) => (
        <ellipse key={x} cx={x} cy={i % 2 ? 7 : 17} rx="9" ry="4" fill="currentColor" opacity="0.6" transform={`rotate(${i % 2 ? -25 : 25} ${x} ${i % 2 ? 7 : 17})`} />
      ))}
      <circle cx="80" cy="12" r="5" fill="currentColor" />
    </svg>
  );
}

// Floral: soft blush, flowers in the corners, handwritten title, round photo.
export function FloralTemplate({ event, parts, labels }: TemplateProps) {
  return (
    <article className="relative mx-auto flex w-full max-w-xl flex-col items-center gap-8 overflow-x-clip px-5 py-12 text-center">
      <Flower className="pointer-events-none absolute -start-10 -top-6 size-36 text-accent opacity-40" />
      <Flower className="pointer-events-none absolute -end-8 top-40 size-24 text-accent opacity-30" />

      <p className="font-serif text-lg italic text-muted">{labels.invited}</p>

      {parts.media && (
        <div className="size-64 overflow-hidden rounded-full border-8 border-surface shadow-lg ring-2 ring-accent/40 sm:size-72 [&_img]:h-full">
          {parts.media}
        </div>
      )}

      <h1 className="font-hand text-6xl leading-none font-bold text-balance sm:text-7xl">{event.title}</h1>
      <Leaves />

      <div className="w-full rounded-[2rem] border-2 border-dashed border-accent/40 bg-surface/70 p-6">{parts.info}</div>
      {parts.countdown}
      {parts.description && <div className="font-serif text-lg leading-relaxed text-muted">{parts.description}</div>}
      {parts.actions}

      <section className="relative flex w-full flex-col gap-4" aria-labelledby="rsvp-title">
        <Flower className="pointer-events-none absolute -bottom-10 -start-12 size-28 text-accent opacity-30" />
        <h2 id="rsvp-title" className="font-hand text-4xl font-bold">{labels.rsvpTitle}</h2>
        {parts.registration}
      </section>
    </article>
  );
}
