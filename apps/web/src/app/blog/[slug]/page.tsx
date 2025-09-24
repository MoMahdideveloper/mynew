import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/server/queries";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    notFound();
  }
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 md:px-0">
      <div className="space-y-3">
        <Link href="/blog" className="text-xs font-semibold uppercase tracking-[0.3em] text-primary hover:underline">
          Back to blog
        </Link>
        <h1 className="text-3xl font-semibold text-ink md:text-4xl">{post.title}</h1>
        <p className="text-sm text-ink-muted">Published {formatDate(post.publishedAt)}</p>
      </div>
      {post.coverImage && (
        <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-border/60">
          <Image src={post.coverImage} alt="" fill className="object-cover" />
        </div>
      )}
      <div className="prose prose-neutral max-w-none text-ink" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
