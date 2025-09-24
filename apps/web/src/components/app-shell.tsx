import { ReactNode } from "react";
import { NavLink } from "@/components/nav-link";
import { isSyncPaused } from "@/server/sync";
import { getSession } from "@/server/auth";
import { signOutAction } from "@/server/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/budgets", label: "Budgets" },
  { href: "/ingestion", label: "Ingestion" },
  { href: "/alerts", label: "Alerts" },
  { href: "/settings", label: "Settings" },
];

export async function AppShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  const syncPaused = isSyncPaused();
  const navItems =
    session.role === "admin"
      ? [...NAV_ITEMS, { href: "/admin", label: "Admin" }]
      : NAV_ITEMS;
  const displayName = session.name ?? process.env.NEXT_PUBLIC_USER_NAME ?? "Zenith";
  return (
    <div className="flex flex-1">
      <aside className="w-64 bg-panel border-r border-border/60 hidden md:flex flex-col gap-6 px-6 py-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Zenith Finance</span>
          <p className="text-lg font-semibold text-ink mt-2">Welcome back, {displayName}</p>
          {syncPaused ? (
            <span className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-negative bg-negative/10 px-2 py-1 rounded-full">
              <span className="inline-block h-2 w-2 rounded-full bg-negative" aria-hidden />
              Sync paused
            </span>
          ) : (
            <span className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-positive bg-positive/10 px-2 py-1 rounded-full">
              <span className="inline-block h-2 w-2 rounded-full bg-positive" aria-hidden />
              Sync live
            </span>
          )}
          <p className="mt-3 text-xs text-ink-muted">Signed in as {session.role}</p>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
        {session.role !== "guest" && (
          <form action={signOutAction} className="mt-auto">
            <button
              type="submit"
              className="w-full rounded-lg border border-border/60 px-3 py-2 text-sm font-medium text-ink hover:bg-border/10 transition"
            >
              Sign out
            </button>
          </form>
        )}
      </aside>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="md:hidden mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-ink-muted">Zenith Finance</p>
                <p className="text-base font-semibold text-ink">Welcome back, {displayName}</p>
              </div>
              {syncPaused ? (
                <span className="text-xs font-medium text-negative bg-negative/10 px-2 py-1 rounded-full">Sync paused</span>
              ) : (
                <span className="text-xs font-medium text-positive bg-positive/10 px-2 py-1 rounded-full">Sync live</span>
              )}
            </div>
            <p className="mt-2 text-xs text-ink-muted">Signed in as {session.role}</p>
            {session.role !== "guest" && (
              <form action={signOutAction} className="mt-3">
                <button
                  type="submit"
                  className="rounded-md border border-border/60 px-3 py-2 text-sm font-medium text-ink hover:bg-border/10 transition"
                >
                  Sign out
                </button>
              </form>
            )}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
