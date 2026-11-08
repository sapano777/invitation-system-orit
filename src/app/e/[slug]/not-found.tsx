import { getTranslations } from "next-intl/server";

export default async function InvitationNotFound() {
  const t = await getTranslations("invitation.notFound");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 px-6 py-16 text-center">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted">{t("body")}</p>
    </main>
  );
}
