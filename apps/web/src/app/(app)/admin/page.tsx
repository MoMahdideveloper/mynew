import Link from "next/link";

import { AdminDashboard } from "@/components/admin-dashboard";
import { getCurrentUser, getSession } from "@/server/session";
import { getAllPosts, getUsers, isStrapiConfigured } from "@/server/strapi";

export default async function AdminPage() {
  const [user, session] = await Promise.all([getCurrentUser(), getSession()]);
  const strapiAvailable = isStrapiConfigured();

  if (user.role !== "admin") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-ink">Admin workspace</h1>
        <p className="text-sm text-ink-muted">
          Sign in with an administrator account to manage Strapi content and user roles. Content remains publicly accessible while you browse as a guest or contributor.
        </p>
        <Link href="/" className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-panel">
          Return to home
        </Link>
      </div>
    );
  }

  const posts = await getAllPosts({
    includeDrafts: true,
    token: session?.jwt ?? undefined,
  });
  const users = await getUsers(session?.jwt ?? undefined);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-ink">Content and user management</h1>
        <p className="text-sm text-ink-muted">
          Create, update, and remove Strapi blog posts. Adjust user roles to grant editorial or administrative access.
        </p>
        {!strapiAvailable && (
          <div className="rounded-md border border-dashed border-accent/40 bg-accent-muted px-4 py-3 text-xs text-accent">
            Strapi is not configured. Provide <code>STRAPI_URL</code> and <code>STRAPI_API_TOKEN</code> to sync changes with your CMS.
          </div>
        )}
      </header>
      <AdminDashboard posts={posts} users={users} strapiAvailable={strapiAvailable} />
    </div>
  );
}
