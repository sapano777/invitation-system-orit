import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EventForm } from "@/components/EventForm";
import { requireStaff } from "@/lib/auth";
import { createEvent } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("newEvent") };
}

export default async function NewEventPage() {
  await requireStaff();
  const t = await getTranslations("admin");
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("newEvent")}</h1>
      <EventForm action={createEvent} cancelHref="/admin" />
    </div>
  );
}
