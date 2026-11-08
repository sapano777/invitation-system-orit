import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { logout } from "@/app/login/actions";

export default async function NoAccessPage() {
  const t = await getTranslations("noAccess");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted">{t("body")}</p>
      <form action={logout}>
        <Button type="submit" variant="secondary">{t("logout")}</Button>
      </form>
    </main>
  );
}
