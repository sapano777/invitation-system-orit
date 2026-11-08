import type { TemplateProps } from "../types";

// Clean business: banner on top, details and registration side by side on
// wide screens.
export function CorporateTemplate({ event, parts, labels }: TemplateProps) {
  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:py-12">
      {parts.media && <div className="overflow-hidden rounded-2xl shadow-sm [&_img]:max-h-80">{parts.media}</div>}

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-start">
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-on-accent">{labels.invited}</p>
            <h1 className="text-3xl leading-tight font-bold text-balance sm:text-4xl">{event.title}</h1>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 [&_dl]:text-start">{parts.info}</div>
          {parts.description && <div className="leading-relaxed text-muted">{parts.description}</div>}
          <div className="[&>div]:items-start [&_div]:justify-start">{parts.actions}</div>
          <div className="[&_[role=timer]]:justify-start">{parts.countdown}</div>
        </div>

        <section className="flex flex-col gap-3 lg:sticky lg:top-6" aria-labelledby="rsvp-title">
          <h2 id="rsvp-title" className="text-xl font-bold">{labels.rsvpTitle}</h2>
          {parts.registration}
        </section>
      </div>
    </article>
  );
}
