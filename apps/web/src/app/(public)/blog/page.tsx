import type { Metadata } from "next";
import Link from "next/link";

import { getAllPosts, isStrapiConfigured } from "@/server/strapi";

export const metadata: Metadata = {
  title: "Zenith Finance Blog",
  description: "Insights, product updates, and guides curated via Strapi.",
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();
  const strapiAvailable = isStrapiConfigured();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold text-ink">Latest stories and release notes</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Every article is managed from your Strapi CMS. Use it to share financial guidance, changelog updates, or onboarding tips for your Zenith Finance workspace.
        </p>
      </header>
      {!strapiAvailable && (
        <div className="mt-6 rounded-md border border-dashed border-accent/40 bg-accent-muted px-4 py-3 text-sm text-accent">
          You are viewing mock content. Connect <code>STRAPI_URL</code> to your live project to sync published posts.
        </div>
      )}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <article key={post.id} className="flex h-full flex-col rounded-xl border border-border bg-panel p-6 shadow-sm">
            <div className="text-xs uppercase tracking-[0.3em] text-ink-muted">
              {new Date(post.publishedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <h2 className="mt-3 text-xl font-semibold text-ink">{post.title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{post.excerpt}</p>
            <div className="mt-4 flex-1" />
            <Link href={`/blog/${post.slug}`} className="mt-6 inline-flex items-center text-sm font-medium text-ink hover:underline">
              Read more →
            </Link>
          </article>
        ))}
        {posts.length === 0 && (
          <div className="col-span-full rounded-xl border border-border border-dashed bg-panel/60 p-6 text-sm text-ink-muted">
            No posts available yet. Publish from Strapi to see them here.
          </div>
        )}
      </div>
    </div>
  );
}
