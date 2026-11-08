"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteEvent } from "@/app/admin/events/actions";
import { Button } from "@/components/ui/Button";

export function DeleteEventButton({ eventId, title }: { eventId: string; title: string }) {
  const t = useTranslations("eventPage");
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (window.confirm(t("deleteConfirm", { title }))) {
          startTransition(() => deleteEvent(eventId));
        }
      }}
    >
      {pending ? t("deleting") : t("delete")}
    </Button>
  );
}
