"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Remaining = { days: number; hours: number; minutes: number; seconds: number } | "started";

function remaining(target: number): Remaining {
  const ms = target - Date.now();
  if (ms <= 0) return "started";
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

// Renders a placeholder on the server and fills in on the client, so the
// markup matches during hydration.
export function Countdown({ dateTime }: { dateTime: string }) {
  const t = useTranslations("invitation.countdown");
  const [value, setValue] = useState<Remaining | null>(null);

  useEffect(() => {
    const target = new Date(dateTime).getTime();
    const tick = () => setValue(remaining(target));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [dateTime]);

  if (value === "started") {
    return <p className="text-center text-sm text-muted">{t("started")}</p>;
  }

  const units = (["days", "hours", "minutes", "seconds"] as const).map((unit) => ({
    unit,
    amount: value ? value[unit] : null,
  }));

  return (
    <div role="timer" aria-label={t("label")} className="flex justify-center gap-2 sm:gap-3">
      {units.map(({ unit, amount }) => (
        <div key={unit} className="flex w-16 flex-col items-center rounded-xl border border-border bg-surface py-2 sm:w-20">
          <span className="text-2xl font-bold tabular-nums sm:text-3xl">{amount === null ? "–" : String(amount).padStart(2, "0")}</span>
          <span className="text-xs text-muted">{t(unit)}</span>
        </div>
      ))}
    </div>
  );
}
