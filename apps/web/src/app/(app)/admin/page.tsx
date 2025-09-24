import { PostEditor } from "@/components/post-editor";
import { UserRoleForm } from "@/components/user-role-form";
import { requireAdminSession } from "@/server/auth";
import { getAllPosts, getUsers } from "@/server/queries";

export const metadata = {
  title: "Admin Console",
};

export default async function AdminPage() {
  await requireAdminSession();
  const [posts, users] = await Promise.all([getAllPosts(), getUsers()]);
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Publish updates</h1>
          <p className="text-sm text-ink-muted">
            Draft fresh content or sync updates to Strapi. Every post is persisted locally so you have an offline backup.
          </p>
        </div>
        <PostEditor />
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Existing posts</h2>
        <div className="grid gap-6">
          {posts.map((post) => (
            <div key={post.id} className="space-y-3">
              <h3 className="text-lg font-semibold text-ink">{post.title}</h3>
              <PostEditor post={post} />
            </div>
          ))}
          {posts.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border/60 bg-panel/40 p-8 text-sm text-ink-muted">
              No posts yet. Use the composer above to publish your first update.
            </p>
          )}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Member roles</h2>
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel/80 text-xs uppercase tracking-[0.2em] text-ink-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-panel">
              {users.map((user) => (
                <tr key={user.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{user.name}</p>
                    <p className="text-xs text-ink-muted">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.role === "guest" ? (
                      <span className="rounded-md bg-border/40 px-2 py-1 text-xs font-semibold text-ink-muted">Guest</span>
                    ) : (
                      <UserRoleForm user={user} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
