"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { geocodeAddress } from "@/app/admin/events/actions";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { parseCoordinates } from "@/lib/events/coordinates";
import type { EventErrorKey } from "@/lib/events/errors";

type Coords = { lat: number; lng: number } | null;

type Props = {
  defaultVenue: string;
  defaultAddress: string;
  defaultCoords: Coords;
  errors: { venue_name?: EventErrorKey; address?: EventErrorKey; lat?: EventErrorKey };
};

// Venue, address and map coordinates. Coordinates power the Waze and Google
// Maps buttons on the invitation; they come from "find on map" or from a
// pasted map link.
export function LocationFields({ defaultVenue, defaultAddress, defaultCoords, errors }: Props) {
  const t = useTranslations("eventForm");
  const [address, setAddress] = useState(defaultAddress);
  const [coords, setCoords] = useState<Coords>(defaultCoords);
  const [found, setFound] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [pending, startTransition] = useTransition();

  function findOnMap() {
    setMessage(null);
    startTransition(async () => {
      const result = await geocodeAddress(address);
      if ("error" in result) {
        setMessage(t(`geocode.${result.error}`));
        return;
      }
      setCoords({ lat: result.lat, lng: result.lng });
      setFound(result.label);
    });
  }

  function applyManual(text: string) {
    setManual(text);
    const parsed = parseCoordinates(text);
    if (parsed) {
      setCoords(parsed);
      setFound(null);
      setMessage(null);
    }
  }

  const coordError = errors.lat ? t(`errors.${errors.lat}`) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="lat" value={coords?.lat ?? ""} />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} />

      <Field label={t("venue_name")} htmlFor="venue_name" error={errors.venue_name && t(`errors.${errors.venue_name}`)}>
        <input id="venue_name" name="venue_name" defaultValue={defaultVenue} maxLength={200} className={inputClass} />
      </Field>

      <Field label={t("address")} htmlFor="address" error={errors.address && t(`errors.${errors.address}`)}>
        <div className="flex gap-2">
          <input
            id="address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={300}
            className={inputClass}
          />
          <Button type="button" variant="secondary" className="shrink-0" disabled={pending || !address.trim()} onClick={findOnMap}>
            {pending ? t("geocode.searching") : t("geocode.button")}
          </Button>
        </div>
      </Field>

      <div className="rounded-lg border border-border bg-background p-3 text-sm" aria-live="polite">
        {coords ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{t("geocode.set")}</p>
              {found && <p className="text-xs text-muted">{found}</p>}
              <p className="text-xs text-muted" dir="ltr">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
            </div>
            <div className="flex gap-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-2"
              >
                {t("geocode.check")}
              </a>
              <button type="button" className="text-muted underline underline-offset-2" onClick={() => { setCoords(null); setFound(null); }}>
                {t("geocode.clear")}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-muted">{t("geocode.none")}</p>
        )}
        {message && <p className="mt-2 text-red-600" role="alert">{message}</p>}
      </div>

      <Field label={t("geocode.manualLabel")} htmlFor="coords_manual" hint={t("geocode.manualHint")} error={coordError}>
        <input
          id="coords_manual"
          value={manual}
          onChange={(e) => applyManual(e.target.value)}
          dir="ltr"
          placeholder="32.0755, 34.7755"
          className={inputClass}
        />
      </Field>
    </div>
  );
}
