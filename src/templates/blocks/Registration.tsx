"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { registerGuest, type RegistrationState } from "@/app/e/[slug]/actions";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import type { RegistrationAvailability } from "@/lib/public-event";
import { MAX_GUESTS_PER_REGISTRATION } from "@/lib/registration/limits";

type Props = {
  slug: string;
  availability: RegistrationAvailability;
  deadlineText: string | null;
};

export function Registration({ slug, availability, deadlineText }: Props) {
  const t = useTranslations("registration");
  const [state, formAction, pending] = useActionState<RegistrationState, FormData>(registerGuest.bind(null, slug), {});
  // "Change my registration" reopens the form for the current result. Any new
  // result from the server is a different object, which ends editing.
  const [editedState, setEditedState] = useState<RegistrationState | null>(null);
  const editing = editedState === state;

  if (!availability.open) {
    return <p className="rounded-xl border border-border bg-surface p-4 text-center">{t(`closed.${availability.reason}`)}</p>;
  }

  if (state.status && !editing) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-accent text-2xl text-on-accent">✓</span>
        <h3 className="text-xl font-bold">{t("thanks.title", { name: state.name ?? "" })}</h3>
        <p className="text-muted">
          {state.status === "updated"
            ? t("thanks.updated", { count: state.guestCount ?? 1 })
            : t("thanks.created", { count: state.guestCount ?? 1 })}
        </p>
        <button type="button" className="text-sm text-muted underline underline-offset-2" onClick={() => setEditedState(state)}>
          {t("thanks.change")}
        </button>
      </div>
    );
  }

  const maxGuests = Math.min(MAX_GUESTS_PER_REGISTRATION, availability.spotsLeft ?? MAX_GUESTS_PER_REGISTRATION);

  return (
    <RegistrationForm
      state={editing ? {} : state}
      pending={pending}
      maxGuests={maxGuests}
      deadlineText={deadlineText}
      onSubmit={(formData) => startTransition(() => formAction(formData))}
    />
  );
}

type FormProps = {
  state: RegistrationState;
  pending: boolean;
  maxGuests: number;
  deadlineText: string | null;
  onSubmit: (formData: FormData) => void;
};

function RegistrationForm({ state, pending, maxGuests, deadlineText, onSubmit }: FormProps) {
  const t = useTranslations("registration");
  const [fullName, setFullName] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [names, setNames] = useState<string[]>([]);

  const errors = state.fieldErrors ?? {};
  const err = (field: string) => {
    const code = errors[field];
    return code ? t(`errors.${code}`) : undefined;
  };
  const invalid = (field: string) => (errors[field] ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {});

  // The first guest is the person registering, unless they typed another name.
  const guestName = (i: number) => names[i] ?? (i === 0 ? fullName : "");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Submit through a transition so React doesn't clear the fields on errors.
    onSubmit(new FormData(e.currentTarget));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 text-start sm:p-6">
      {/* Honeypot: hidden from people and screen readers, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <Field label={t("full_name")} htmlFor="full_name" required error={err("full_name")}>
        <input
          id="full_name"
          name="full_name"
          autoComplete="name"
          required
          maxLength={120}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
          {...invalid("full_name")}
        />
      </Field>

      <Field label={t("phone")} htmlFor="phone" required error={err("phone")} hint={t("phoneHint")}>
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" required maxLength={20} className={`${inputClass} text-start`} {...invalid("phone")} />
      </Field>

      <Field label={t("email")} htmlFor="email" error={err("email")} hint={t("emailHint")}>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" maxLength={200} className={`${inputClass} text-start`} {...invalid("email")} />
      </Field>

      <Field label={t("guest_count")} htmlFor="guest_count" required error={err("guest_count")}>
        <select
          id="guest_count"
          name="guest_count"
          value={guestCount}
          onChange={(e) => setGuestCount(Number(e.target.value))}
          className={inputClass}
          {...invalid("guest_count")}
        >
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("guest_names")}</legend>
        <p className="text-xs text-muted">{t("guestNamesHint")}</p>
        {Array.from({ length: guestCount }, (_, i) => (
          <input
            key={i}
            name="guest_names"
            aria-label={t("guestNameN", { n: i + 1 })}
            placeholder={t("guestNameN", { n: i + 1 })}
            maxLength={120}
            value={guestName(i)}
            onChange={(e) => {
              const next = Array.from({ length: guestCount }, (_, j) => guestName(j));
              next[i] = e.target.value;
              setNames(next);
            }}
            className={inputClass}
          />
        ))}
        {err("guest_names") && <p className="text-xs text-red-600" role="alert">{err("guest_names")}</p>}
      </fieldset>

      <Field label={t("notes")} htmlFor="notes" hint={t("notesHint")} error={err("notes")}>
        <textarea id="notes" name="notes" rows={3} maxLength={1000} className={inputClass} />
      </Field>

      {state.formError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.formError === "full" && state.spotsLeft !== undefined
            ? t("errors.full_with_spots", { count: state.spotsLeft })
            : t(`errors.${state.formError}`)}
        </p>
      )}

      <Button type="submit" disabled={pending} className="bg-accent! text-on-accent! py-3 text-base">
        {pending ? t("submitting") : t("submit")}
      </Button>

      <p className="text-center text-xs text-muted">
        {deadlineText && <span className="block">{t("deadline", { date: deadlineText })}</span>}
        {t("updateHint")}
      </p>
    </form>
  );
}
