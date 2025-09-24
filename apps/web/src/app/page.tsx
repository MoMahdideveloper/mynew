import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { AuthGateway } from "@/components/auth-gateway";
import { getLatestPosts } from "@/server/queries";
import { getSession } from "@/server/auth";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function HomePage() {
  const [session, posts] = await Promise.all([getSession(), getLatestPosts(3)]);
  const isGuest = session.role === "guest";
  return (
    <div className="flex flex-col gap-16 px-4 py-12 md:px-12 lg:px-20">
      <section className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
            Zenith Finance
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
              Always free <ArrowRightIcon className="h-3 w-3" />
            </span>
          </span>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">
            Take control of spending, budgets, and drafts without waiting on an AI guess.
          </h1>
          <p className="text-base text-ink-muted md:text-lg">
            Review transactions, monitor guardrails, and ingest drafts from any source. Plug in Strapi CMS to publish insights and keep clients in the loop.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <AuthGateway initialMode={isGuest ? "signup" : "signin"} />
            <div className="rounded-3xl border border-border/60 bg-panel p-6 text-sm text-ink-muted">
              <p className="font-semibold text-ink">What you get</p>
              <ul className="mt-3 space-y-2">
                <li>• Unlimited transactions, budgets, and scenarios</li>
                <li>• Predictive nudges and inline recalculation</li>
                <li>• Optional Strapi-powered blog for financial storytelling</li>
              </ul>
              <Link href="/blog" className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline">
                Browse the latest posts <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-border/60 bg-panel/70 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-ink">Why teams choose Zenith</h2>
          <div className="mt-6 space-y-5 text-sm text-ink-muted">
            <div>
              <p className="font-semibold text-ink">Free forever</p>
              <p>Every budgeting and transaction workflow stays unlocked. Upgrade later only if you need bank sync.</p>
            </div>
            <div>
              <p className="font-semibold text-ink">CMS-friendly</p>
              <p>Sync posts from Strapi on the free tier while keeping a local JSON backup for offline access.</p>
            </div>
            <div>
              <p className="font-semibold text-ink">Admin-ready</p>
              <p>Manage posts and member roles from the built-in admin console without leaving the app shell.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Latest from the blog</h2>
          <Link href="/blog" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
            View all posts <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-border/60 bg-panel/60 p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">{formatDate(post.publishedAt)}</p>
              <h3 className="mt-3 text-lg font-semibold text-ink">
                <Link href={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h3>
              <p className="mt-3 text-sm text-ink-muted">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline"
              >
                Read post <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
