import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { hasSupabaseEnv } from "@/lib/env";
import { getAuthState } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login");
  return { title: t("title") };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (hasSupabaseEnv() && (await getAuthState()).status === "staff") redirect("/admin");

  const { next } = await searchParams;
  const t = await getTranslations();

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("app.name")}</h1>
        <LocaleSwitcher />
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold">{t("login.title")}</h2>
        <LoginForm next={typeof next === "string" ? next : undefined} />
      </div>
    </main>
  );
}
