"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading, authenticatedUser, navItems, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !authenticatedUser) {
      router.replace("/login");
    }
  }, [loading, authenticatedUser, router]);

  if (loading || !authenticatedUser) {
    return <div className="p-6">Bezig met laden...</div>;
  }

  return (
    <div className="relative flex min-h-screen gap-8 px-6 py-10 text-ink md:px-10">
      <aside className="sticky top-10 hidden h-[calc(100vh-5rem)] w-72 flex-shrink-0 flex-col gap-6 overflow-hidden rounded-[32px] border border-white/40 bg-white/65 p-6 shadow-glass backdrop-blur-xl lg:flex">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-500 via-brand-400 to-mint-400 p-6 text-white shadow-glow">
          <div className="pill bg-white/20 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90">
            {APP_NAME}
          </div>
          <p className="mt-4 text-sm text-white/90">Ingelogd als</p>
          <p className="mt-1 break-words text-lg font-semibold leading-snug">{authenticatedUser.email}</p>
          <p className="mt-3 text-xs uppercase tracking-wider text-white/70">{authenticatedUser.role}</p>
        </div>

        <div className="flex flex-1 min-h-0 flex-col">
          <nav className="flex-1 overflow-y-auto pr-1">
            <div className="flex flex-col gap-2 pb-6">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition",
                      active
                        ? "bg-white text-brand-500 shadow-glow"
                        : "text-ink/70 hover:bg-white/70 hover:text-brand-500",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="-mx-4 mt-auto shrink-0 rounded-[24px] border border-white/60 bg-white/80 px-4 py-3 backdrop-blur-sm">
            <Button
              variant="secondary"
              className="w-full justify-center border border-white/70 bg-white text-red-500 hover:bg-red-50"
              onClick={logout}
            >
              Uitloggen
            </Button>
          </div>
        </div>
      </aside>

      <main className="relative flex w-full flex-1 flex-col">
        <div className="mb-6 grid gap-3 lg:hidden">
          <div className="rounded-[28px] border border-white/50 bg-white/70 p-5 text-sm text-ink/70 shadow-glass backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-brand-500">Ingelogd als</p>
            <p className="mt-1 font-semibold text-ink">{authenticatedUser.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    active ? "bg-brand-500 text-white shadow-glow" : "bg-white/70 text-ink/70 hover:text-brand-500",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Button
              variant="secondary"
              className="rounded-full border border-white/70 bg-white text-red-500 hover:bg-red-50"
              onClick={logout}
            >
              Uitloggen
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl space-y-10 pb-16">{children}</div>
      </main>
    </div>
  );
}
