import { ReactNode } from "react";
import { NavLink } from "@/components/nav-link";
import { getCurrentUser } from "@/server/session";
import { isSyncPaused } from "@/server/sync";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/budgets", label: "Budgets" },
  { href: "/ingestion", label: "Ingestion" },
  { href: "/alerts", label: "Alerts" },
  { href: "/settings", label: "Settings" },
];

export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const name = user.username;
  const syncPaused = isSyncPaused();
  const roleLabel = user.role ?? "guest";
  const items =
    user.role === "admin"
      ? [...NAV_ITEMS, { href: "/admin", label: "Admin" }]
      : NAV_ITEMS;
  return (
    <div className="flex flex-1">
      <aside className="w-64 bg-panel border-r border-border/60 hidden md:flex flex-col gap-6 px-6 py-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Zenith Finance</span>
          <p className="text-lg font-semibold text-ink mt-2">Welcome back, {name}</p>
          <p className="text-xs text-ink-muted">{roleLabel === "guest" ? "Guest" : roleLabel} workspace</p>
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
        </div>
        <nav className="flex flex-col gap-2">
          {items.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="md:hidden mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-ink-muted">Zenith Finance</p>
                <p className="text-base font-semibold text-ink">Welcome back, {name}</p>
                <p className="text-xs text-ink-muted">{roleLabel === "guest" ? "Guest" : roleLabel} workspace</p>
              </div>
              {syncPaused ? (
                <span className="text-xs font-medium text-negative bg-negative/10 px-2 py-1 rounded-full">Sync paused</span>
              ) : (
                <span className="text-xs font-medium text-positive bg-positive/10 px-2 py-1 rounded-full">Sync live</span>
              )}
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
