import type { TemplateProps } from "../types";

function HeartLine() {
  return (
    <div aria-hidden className="flex w-48 items-center gap-3 text-accent">
      <span className="h-px flex-1 bg-gradient-to-l from-current to-transparent opacity-60" />
      <svg viewBox="0 0 24 22" className="size-4">
        <path d="M12 21 C5 15 1 11 1 6.5 A5.5 5.5 0 0 1 12 4 A5.5 5.5 0 0 1 23 6.5 C23 11 19 15 12 21 Z" fill="currentColor" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-r from-current to-transparent opacity-60" />
    </div>
  );
}

// Romantic: soft gradient, oval photo, thin elegant serif.
export function RomanticTemplate({ event, parts, labels }: TemplateProps) {
  return (
    <article
      className="w-full"
      style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 14%, var(--background)) 0%, var(--background) 45%)" }}
    >
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 px-5 py-12 text-center">
        <p className="font-romantic text-xl tracking-wide ltr:tracking-[0.2em] text-muted">{labels.invited}</p>

        {parts.media && (
          <div className="aspect-[3/4] w-56 overflow-hidden rounded-[50%] border border-accent/40 p-2 sm:w-64">
            <div className="size-full overflow-hidden rounded-[50%] [&_img]:h-full">{parts.media}</div>
          </div>
        )}

        <h1 className="font-romantic text-5xl leading-tight text-balance sm:text-6xl">{event.title}</h1>
        <HeartLine />

        {parts.info}
        <div className="[&_[role=timer]>div]:rounded-full [&_[role=timer]>div]:border-accent/30">{parts.countdown}</div>
        {parts.description && <div className="font-romantic text-xl leading-relaxed text-muted italic">{parts.description}</div>}
        {parts.actions}
        <HeartLine />

        <section className="flex w-full flex-col gap-4" aria-labelledby="rsvp-title">
          <h2 id="rsvp-title" className="font-romantic text-3xl">{labels.rsvpTitle}</h2>
          <div className="[&_form]:rounded-3xl [&_button[type=submit]]:rounded-full">{parts.registration}</div>
        </section>
      </div>
    </article>
  );
}
