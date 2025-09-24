import type { Metadata } from "next";
import Link from "next/link";

import { HomeAuthPanel } from "@/components/home-auth-panel";
import { getLatestPosts, isStrapiConfigured } from "@/server/strapi";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = {
  title: "Zenith Finance | Personal finance workspace",
  description:
    "Review transactions, manage budgets, ingest drafts, and publish financial insights backed by Strapi-powered content.",
};

export default async function LandingPage() {
  const [posts, user] = await Promise.all([getLatestPosts(3), getCurrentUser()]);
  const strapiAvailable = isStrapiConfigured();

  return (
    <div className="bg-surface">
      <section className="border-b border-border bg-gradient-to-br from-panel/60 via-surface to-panel/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink-muted">
              Personal finance, without limits
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-ink md:text-5xl">
              Operate Zenith Finance with built-in content and always-free access.
            </h1>
            <p className="max-w-xl text-base text-ink-muted">
              Consolidate budgets, transactions, ingestion drafts, and insights in a single Next.js workspace. Publish articles through Strapi, empower admins with CRUD, and invite anyone to explore—even without an account.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-surface shadow-sm hover:bg-ink/90"
              >
                Explore the dashboard
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-panel"
              >
                Browse the blog
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 text-sm text-ink-muted sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-panel/70 p-4">
                <h3 className="text-sm font-semibold text-ink">Guest friendly</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Every financial tool stays unlocked. Sign in only when you want to personalize suggestions or publish content.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-panel/70 p-4">
                <h3 className="text-sm font-semibold text-ink">Strapi-connected</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Free Strapi tiers power your blog, admin CRUD, and user management while staying decoupled from core finance data.
                </p>
              </div>
            </div>
          </div>
          <div id="auth" className="flex-1">
            <HomeAuthPanel user={user} strapiAvailable={strapiAvailable} />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Latest posts</h2>
            <p className="text-sm text-ink-muted">
              Highlights from your Strapi-powered editorial calendar.
            </p>
          </div>
          <Link href="/blog" className="text-sm font-medium text-ink hover:underline">
            View all posts
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="flex flex-col rounded-xl border border-border bg-panel p-6 shadow-sm">
              <div className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                {new Date(post.publishedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-ink">{post.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{post.excerpt}</p>
              <div className="mt-4 flex-1" />
              <Link href={`/blog/${post.slug}`} className="mt-6 inline-flex items-center text-sm font-medium text-ink hover:underline">
                Read more →
              </Link>
            </article>
          ))}
          {posts.length === 0 && (
            <div className="col-span-full rounded-xl border border-border border-dashed bg-panel/60 p-6 text-sm text-ink-muted">
              No posts yet—connect Strapi or seed mock posts to showcase editorial updates on the homepage.
            </div>
          )}
        </div>
      </section>
      <section className="border-t border-border bg-panel/70">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold text-ink">Why pair Strapi with Zenith Finance?</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface/80 p-5">
              <h3 className="text-sm font-semibold text-ink">Admin CRUD</h3>
              <p className="mt-2 text-sm text-ink-muted">
                Manage posts, drafts, and user roles from a dedicated admin hub backed by Strapi’s authentication and permissions.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface/80 p-5">
              <h3 className="text-sm font-semibold text-ink">Content marketing</h3>
              <p className="mt-2 text-sm text-ink-muted">
                Publish guides, release notes, and nudges that appear instantly on the homepage and inside the admin dashboard.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface/80 p-5">
              <h3 className="text-sm font-semibold text-ink">Always-on guest access</h3>
              <p className="mt-2 text-sm text-ink-muted">
                Keep financial tooling unlocked so evaluators can explore budgets and transactions before creating an account.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
