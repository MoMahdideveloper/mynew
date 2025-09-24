import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPostBySlug, isStrapiConfigured } from "@/server/strapi";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return {
      title: "Post not found | Zenith Finance",
    } satisfies Metadata;
  }
  return {
    title: `${post.title} | Zenith Finance`,
    description: post.excerpt,
  } satisfies Metadata;
}

function renderContent(content: string) {
  return content
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={index} className="mt-4 text-sm leading-6 text-ink-muted">
        {paragraph}
      </p>
    ));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
    return null;
  }

  const strapiAvailable = isStrapiConfigured();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-xs uppercase tracking-[0.3em] text-ink-muted">
        {new Date(post.publishedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>
      <h1 className="mt-3 text-3xl font-semibold text-ink">{post.title}</h1>
      <p className="mt-4 text-base text-ink-muted">{post.excerpt}</p>
      {!strapiAvailable && (
        <div className="mt-6 rounded-md border border-dashed border-accent/40 bg-accent-muted px-4 py-3 text-xs text-accent">
          This article is served from mock data. Connect your Strapi project to render live content.
        </div>
      )}
      <div className="mt-8 text-sm leading-6 text-ink-muted">{renderContent(post.content)}</div>
    </article>
  );
}
