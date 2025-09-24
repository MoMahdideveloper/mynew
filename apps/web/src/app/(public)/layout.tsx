import { ReactNode } from "react";
import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentUser } from "@/server/session";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-panel/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-ink">
            Zenith Finance
          </Link>
          <nav className="flex items-center gap-4 text-sm text-ink-muted">
            <Link href="/" className="hover:text-ink transition">
              Home
            </Link>
            <Link href="/blog" className="hover:text-ink transition">
              Blog
            </Link>
            <Link href="/dashboard" className="hover:text-ink transition">
              Dashboard
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {user.role !== "guest" ? (
              <>
                <span className="text-xs text-ink-muted">{user.username}</span>
                <SignOutButton />
              </>
            ) : (
              <a
                href="#auth"
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface/60"
              >
                Sign in / Guest
              </a>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 bg-surface">{children}</main>
      <footer className="border-t border-border bg-panel/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-ink-muted md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Zenith Finance. Personal finance, simplified.</span>
          <div className="flex gap-3">
            <Link href="/blog" className="hover:text-ink transition">
              Latest posts
            </Link>
            <Link href="/settings" className="hover:text-ink transition">
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
