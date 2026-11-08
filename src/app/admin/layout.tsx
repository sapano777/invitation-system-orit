import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { logout } from "@/app/login/actions";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { requireStaff } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Pages check again: a layout doesn't re-run on every navigation.
  const user = await requireStaff();
  const t = await getTranslations();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="text-lg font-bold">
            {t("app.name")}
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{user.displayName ?? user.email}</span>
            <LocaleSwitcher />
            <form action={logout}>
              <button type="submit" className="text-muted underline-offset-2 hover:text-foreground hover:underline">
                {t("admin.logout")}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
