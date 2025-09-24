import Link from "next/link";
import { getAllPosts } from "@/server/queries";

export const metadata = {
  title: "Zenith Finance Blog",
  description: "Practical workflows for budgets, drafts, and financial ops",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function BlogIndexPage() {
  const posts = await getAllPosts();
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 md:px-8">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold text-ink">Insights & playbooks</h1>
        <p className="text-sm text-ink-muted">
          Curated guides straight from Zenith Finance. Connect Strapi to publish your own updates to this feed.
        </p>
      </header>
      <div className="grid gap-6">
        {posts.map((post) => (
          <article key={post.id} className="rounded-2xl border border-border/60 bg-panel/60 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">{formatDate(post.publishedAt)}</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">
              <Link href={`/blog/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="mt-4 text-sm text-ink-muted">{post.excerpt}</p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-5 inline-flex items-center text-sm font-semibold text-primary hover:underline"
            >
              Read the full story →
            </Link>
          </article>
        ))}
        {posts.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border/60 bg-panel/40 p-10 text-center text-sm text-ink-muted">
            No posts yet. Head to the admin console to create your first article.
          </p>
        )}
      </div>
    </div>
  );
}
