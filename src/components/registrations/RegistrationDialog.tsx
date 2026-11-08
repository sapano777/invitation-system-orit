"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  createRegistration,
  updateRegistration,
  type StaffRegistrationState,
} from "@/app/admin/events/[id]/registrations/actions";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { formatPhone } from "@/lib/phone";
import { guestNamesList } from "@/lib/registration/guest-names";
import type { RegistrationRow } from "@/lib/types/database";

type Props = {
  eventId: string;
  // null = add a new registration.
  registration: RegistrationRow | null;
  onClose: () => void;
};

// Native <dialog> as a modal: focus trapping, Esc to close and the backdrop
// come from the browser.
export function RegistrationDialog({ eventId, registration, onClose }: Props) {
  const t = useTranslations("registrations");
  const ref = useRef<HTMLDialogElement>(null);
  const action = registration
    ? updateRegistration.bind(null, eventId, registration.id)
    : createRegistration.bind(null, eventId);
  const [state, formAction, pending] = useActionState<StaffRegistrationState, FormData>(action, {});

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);

  const errors = state.fieldErrors ?? {};
  const err = (field: string) => {
    const code = errors[field];
    return code ? t(`errors.${code}`) : undefined;
  };
  const invalid = (field: string) => (errors[field] ? { "aria-invalid": true, "aria-describedby": `reg-${field}-error` } : {});

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="registration-dialog-title"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/40"
    >
      <form onSubmit={onSubmit} noValidate className="flex max-h-[85vh] flex-col">
        <h2 id="registration-dialog-title" className="border-b border-border px-5 py-4 text-lg font-semibold">
          {registration ? t("dialog.editTitle") : t("dialog.addTitle")}
        </h2>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <Field label={t("dialog.full_name")} htmlFor="reg-full_name" required error={err("full_name")}>
            <input id="reg-full_name" name="full_name" defaultValue={registration?.full_name} maxLength={120} required autoFocus className={inputClass} {...invalid("full_name")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("dialog.phone")} htmlFor="reg-phone" required error={err("phone")}>
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                dir="ltr"
                defaultValue={registration ? formatPhone(registration.phone) : ""}
                maxLength={20}
                required
                className={`${inputClass} text-start`}
                {...invalid("phone")}
              />
            </Field>
            <Field label={t("dialog.email")} htmlFor="reg-email" error={err("email")}>
              <input id="reg-email" name="email" type="email" dir="ltr" defaultValue={registration?.email ?? ""} maxLength={200} className={`${inputClass} text-start`} {...invalid("email")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("dialog.guest_count")} htmlFor="reg-guest_count" required error={err("guest_count")}>
              <input
                id="reg-guest_count"
                name="guest_count"
                type="number"
                inputMode="numeric"
                min={1}
                max={50}
                defaultValue={registration?.guest_count ?? 1}
                required
                className={inputClass}
                {...invalid("guest_count")}
              />
            </Field>
            {registration && (
              <Field label={t("dialog.status")} htmlFor="reg-status">
                <select id="reg-status" name="status" defaultValue={registration.status} className={inputClass}>
                  <option value="confirmed">{t("status.confirmed")}</option>
                  <option value="cancelled">{t("status.cancelled")}</option>
                </select>
              </Field>
            )}
          </div>
          <Field label={t("dialog.guest_names")} htmlFor="reg-guest_names" hint={t("dialog.guestNamesHint")} error={err("guest_names")}>
            <textarea
              id="reg-guest_names"
              name="guest_names"
              rows={3}
              defaultValue={guestNamesList(registration?.guest_names).join("\n")}
              className={inputClass}
            />
          </Field>
          <Field label={t("dialog.notes")} htmlFor="reg-notes" error={err("notes")}>
            <textarea id="reg-notes" name="notes" rows={2} defaultValue={registration?.notes ?? ""} maxLength={1000} className={inputClass} />
          </Field>
          {!registration && <p className="text-xs text-muted">{t("dialog.capacityNote")}</p>}
          {state.formError && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
              {t(`errors.${state.formError}`)}
            </p>
          )}
        </div>

        <div className="flex gap-3 border-t border-border px-5 py-4">
          <Button type="submit" disabled={pending}>{pending ? t("dialog.saving") : t("dialog.save")}</Button>
          <Button type="button" variant="secondary" onClick={() => ref.current?.close()}>{t("dialog.cancel")}</Button>
        </div>
      </form>
    </dialog>
  );
}
