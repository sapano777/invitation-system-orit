import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

// Temporary landing page. In stage 1 this becomes a redirect to /admin.
export default async function Home() {
  const t = await getTranslations();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t("app.name")}</h1>
        <LocaleSwitcher />
      </div>
      <p className="text-lg text-muted">{t("app.tagline")}</p>
      <p className="rounded-xl border border-border bg-surface p-4 text-sm">{t("home.status")}</p>
    </main>
  );
}
