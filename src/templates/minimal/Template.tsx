import type { TemplateProps } from "../types";

// Minimal: typography and white space, everything aligned to the start edge.
export function MinimalTemplate({ event, parts, labels }: TemplateProps) {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-6 py-12 sm:py-20">
      <header className="flex flex-col gap-6">
        <p className="text-xs uppercase tracking-wide ltr:tracking-[0.4em] text-muted">{labels.invited}</p>
        <h1 className="font-light text-5xl leading-[1.05] font-extralight tracking-tight text-balance sm:text-7xl">{event.title}</h1>
        <div aria-hidden className="h-px w-16 bg-foreground" />
      </header>

      {parts.media && <div className="aspect-[4/3] overflow-hidden [&_img]:h-full">{parts.media}</div>}

      <div className="grid gap-10 sm:grid-cols-2">
        <div className="[&_dl]:text-start [&_dd]:font-normal">{parts.info}</div>
        <div className="flex flex-col gap-8">
          {parts.description && <div className="text-lg leading-relaxed text-muted">{parts.description}</div>}
          <div className="[&_[role=timer]]:justify-start [&_[role=timer]>div]:rounded-none [&_[role=timer]>div]:border-x-0 [&_[role=timer]>div]:border-t-0 [&_[role=timer]>div]:bg-transparent">
            {parts.countdown}
          </div>
        </div>
      </div>

      <div className="[&>div]:items-start [&_div]:justify-start [&_a]:rounded-none">{parts.actions}</div>

      <section className="flex flex-col gap-6 border-t border-foreground pt-10" aria-labelledby="rsvp-title">
        <h2 id="rsvp-title" className="font-light text-3xl font-light">{labels.rsvpTitle}</h2>
        <div className="[&_form]:rounded-none [&_form]:border-0 [&_form]:bg-transparent [&_form]:p-0">{parts.registration}</div>
      </section>
    </article>
  );
}
