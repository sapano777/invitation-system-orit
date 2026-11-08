import type { TemplateProps } from "../types";

// Modern dark: full-bleed photo with the title over it, glowing accent.
export function MidnightTemplate({ event, parts, labels }: TemplateProps) {
  return (
    <article className="flex w-full flex-col">
      <header className="relative isolate flex min-h-[60svh] flex-col justify-end overflow-hidden">
        {parts.media ? (
          <div className="absolute inset-0 -z-10 [&_img]:h-full">{parts.media}</div>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{ background: "radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--accent) 45%, transparent), transparent 60%)" }}
          />
        )}
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="mx-auto w-full max-w-2xl px-5 pb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide ltr:tracking-[0.25em] text-accent">{labels.invited}</p>
          <h1 className="text-4xl leading-none font-black tracking-tight text-balance sm:text-6xl">{event.title}</h1>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 pb-14">
        <div className="grid gap-6 rounded-3xl border border-border bg-surface p-6 sm:grid-cols-2 sm:items-center">
          {parts.info}
          {parts.countdown}
        </div>
        {parts.description && <div className="text-lg leading-relaxed text-muted">{parts.description}</div>}
        {parts.actions}
        <section
          className="flex flex-col gap-4 rounded-3xl p-1"
          style={{ boxShadow: "0 0 80px -20px color-mix(in srgb, var(--accent) 60%, transparent)" }}
          aria-labelledby="rsvp-title"
        >
          <h2 id="rsvp-title" className="px-4 pt-4 text-2xl font-bold">{labels.rsvpTitle}</h2>
          {parts.registration}
        </section>
      </div>
    </article>
  );
}
