import type { CSSProperties } from "react";
import type { TemplateProps } from "../types";

const grid: CSSProperties = {
  backgroundImage:
    "linear-gradient(color-mix(in srgb, var(--accent) 9%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--accent) 9%, transparent) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
};

function WindowBar() {
  return (
    <div aria-hidden className="flex gap-1.5 border-b border-border px-4 py-3">
      <span className="size-2.5 rounded-full bg-[#ff5f57]" />
      <span className="size-2.5 rounded-full bg-[#febc2e]" />
      <span className="size-2.5 rounded-full bg-[#28c840]" />
    </div>
  );
}

// Tech: dark grid, monospace labels, details in a terminal-style window.
export function TechTemplate({ event, parts, labels }: TemplateProps) {
  return (
    <article className="w-full" style={grid}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-5 py-10 sm:py-16">
        <header className="flex flex-col gap-4">
          <p className="text-sm text-accent">
            <span className="font-mono">{"// "}</span>
            {labels.invited}
          </p>
          <h1 className="font-tech text-4xl leading-tight font-bold text-balance sm:text-6xl">{event.title}</h1>
          <div aria-hidden className="h-1 w-24 rounded-full bg-accent shadow-[0_0_24px_var(--accent)]" />
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {parts.media && (
            <div className="overflow-hidden rounded-xl border border-accent/40 shadow-[0_0_40px_-12px_var(--accent)] [&_img]:h-full lg:aspect-auto">
              {parts.media}
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <WindowBar />
            <div className="p-5 [&_dl]:text-start [&_dt]:normal-case [&_dt]:tracking-normal [&_dt]:text-accent">{parts.info}</div>
          </div>
        </div>

        <div className="[&_[role=timer]]:justify-start [&_[role=timer]>div]:rounded-md [&_[role=timer]_span:first-child]:font-mono [&_[role=timer]_span:first-child]:text-accent">
          {parts.countdown}
        </div>
        {parts.description && <div className="max-w-2xl text-lg leading-relaxed text-muted">{parts.description}</div>}
        <div className="[&>div]:items-start [&_div]:justify-start [&_a]:rounded-md">{parts.actions}</div>

        <section className="flex max-w-xl flex-col gap-4" aria-labelledby="rsvp-title">
          <h2 id="rsvp-title" className="font-tech text-2xl font-bold">
            <span className="font-mono text-accent">{"> "}</span>
            {labels.rsvpTitle}
          </h2>
          <div className="[&_form]:rounded-xl [&_button[type=submit]]:rounded-md">{parts.registration}</div>
        </section>
      </div>
    </article>
  );
}
