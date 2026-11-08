import type { TemplateProps } from "../types";

// Classic: centred and formal, serif headings, the photo in an arched frame.
export function ClassicTemplate({ event, parts, labels }: TemplateProps) {
  return (
    <article className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 px-5 py-10 text-center sm:py-14">
      <p className="font-serif text-sm uppercase tracking-[0.3em] text-muted">{labels.invited}</p>

      {parts.media && (
        <div className="w-full max-w-sm overflow-hidden rounded-t-full border-4 border-surface shadow-lg outline outline-1 outline-border">
          {parts.media}
        </div>
      )}

      <h1 className="font-serif text-4xl leading-tight font-bold text-balance sm:text-5xl">{event.title}</h1>

      <Ornament />
      {parts.info}
      {parts.countdown}
      {parts.description && <div className="max-w-md text-lg leading-relaxed text-muted">{parts.description}</div>}
      {parts.actions}
      <Ornament />

      <section className="flex w-full flex-col gap-4" aria-labelledby="rsvp-title">
        <h2 id="rsvp-title" className="font-serif text-2xl font-bold">{labels.rsvpTitle}</h2>
        {parts.registration}
      </section>
    </article>
  );
}

function Ornament() {
  return (
    <div aria-hidden className="flex w-40 items-center gap-3 text-accent">
      <span className="h-px flex-1 bg-current opacity-50" />
      <span className="text-lg">❦</span>
      <span className="h-px flex-1 bg-current opacity-50" />
    </div>
  );
}
