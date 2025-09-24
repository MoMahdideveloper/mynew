"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  AdminActionState,
  createPostAction,
  deletePostAction,
  updatePostAction,
  updateUserRoleAction,
} from "@/app/(app)/admin/actions";
import { BlogPost, StrapiUser } from "@/types";

const initialState: AdminActionState = {};

function ActionButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-surface shadow-sm hover:bg-ink/90 disabled:opacity-70"
      disabled={pending}
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

function AdminMessage({ state }: { state: AdminActionState }) {
  if (state.error) {
    return <p className="text-xs text-negative">{state.error}</p>;
  }
  if (state.success && state.message) {
    return <p className="text-xs text-positive">{state.message}</p>;
  }
  return null;
}

interface AdminDashboardProps {
  posts: BlogPost[];
  users: StrapiUser[];
  strapiAvailable: boolean;
}

export function AdminDashboard({ posts, users, strapiAvailable }: AdminDashboardProps) {
  const [selectedPostId, setSelectedPostId] = useState<string>(posts[0]?.id ?? "");
  const [createState, createAction] = useFormState(createPostAction, initialState);
  const [updateState, updateAction] = useFormState(updatePostAction, initialState);
  const [deleteState, deleteAction] = useFormState(deletePostAction, initialState);
  const [userState, userAction] = useFormState(updateUserRoleAction, initialState);

  const selectedPost = useMemo(() => posts.find((post) => post.id === selectedPostId), [posts, selectedPostId]);

  return (
    <div className="grid gap-10">
      <section className="rounded-xl border border-border bg-panel p-6 shadow-sm">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Create a new post</h2>
            <p className="text-sm text-ink-muted">Publish updates directly to the public blog.</p>
          </div>
          {!strapiAvailable && (
            <span className="rounded-full border border-dashed border-accent/50 bg-accent-muted px-3 py-1 text-xs text-accent">
              Connect Strapi to persist these changes.
            </span>
          )}
        </header>
        <form action={createAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-ink">
            Title
            <input
              name="title"
              type="text"
              required
              placeholder="Quarterly insights"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
              disabled={!strapiAvailable}
            />
          </label>
          <label className="text-sm font-medium text-ink">
            Slug
            <input
              name="slug"
              type="text"
              required
              placeholder="quarterly-insights"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
              disabled={!strapiAvailable}
            />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-ink">
            Excerpt
            <textarea
              name="excerpt"
              rows={2}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
              disabled={!strapiAvailable}
            />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-ink">
            Content
            <textarea
              name="content"
              rows={4}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
              disabled={!strapiAvailable}
            />
          </label>
          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <AdminMessage state={createState} />
            <ActionButton label="Create post" />
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-panel p-6 shadow-sm">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Edit existing posts</h2>
            <p className="text-sm text-ink-muted">Select a post to update its metadata or remove it.</p>
          </div>
          <select
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
            value={selectedPostId}
            onChange={(event) => setSelectedPostId(event.target.value)}
          >
            {posts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title}
              </option>
            ))}
          </select>
        </header>
        {selectedPost ? (
          <div className="mt-4 grid gap-3">
            <form action={updateAction} className="grid gap-3">
              <input type="hidden" name="id" value={selectedPost.id} />
              <label className="text-sm font-medium text-ink">
                Title
                <input
                  name="title"
                  type="text"
                  defaultValue={selectedPost.title}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
                  disabled={!strapiAvailable}
                />
              </label>
              <label className="text-sm font-medium text-ink">
                Slug
                <input
                  name="slug"
                  type="text"
                  defaultValue={selectedPost.slug}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
                  disabled={!strapiAvailable}
                />
              </label>
              <label className="text-sm font-medium text-ink">
                Excerpt
                <textarea
                  name="excerpt"
                  rows={2}
                  defaultValue={selectedPost.excerpt}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
                  disabled={!strapiAvailable}
                />
              </label>
              <label className="text-sm font-medium text-ink">
                Content
                <textarea
                  name="content"
                  rows={5}
                  defaultValue={selectedPost.content}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
                  disabled={!strapiAvailable}
                />
              </label>
              <div className="flex items-center justify-between gap-3">
                <AdminMessage state={updateState} />
                <ActionButton label="Update post" />
              </div>
            </form>
            <form action={deleteAction} className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3">
              <input type="hidden" name="id" value={selectedPost.id} />
              <div className="text-sm text-ink-muted">
                Remove “{selectedPost.title}” from the blog.
              </div>
              <button
                type="submit"
                className="rounded-md border border-negative/40 bg-negative/10 px-3 py-1.5 text-sm font-semibold text-negative hover:bg-negative/20 disabled:opacity-70"
                disabled={!strapiAvailable}
              >
                Delete
              </button>
            </form>
            <AdminMessage state={deleteState} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">No posts available yet.</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-panel p-6 shadow-sm">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Manage user roles</h2>
            <p className="text-sm text-ink-muted">Elevate teammates to admins or revert them to contributor roles.</p>
          </div>
        </header>
        {users.length > 0 ? (
          <form action={userAction} className="mt-4 grid gap-3 md:grid-cols-[2fr,1fr,auto] md:items-end">
            <label className="text-sm font-medium text-ink">
              User
              <select
                name="userId"
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
                disabled={!strapiAvailable}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-ink">
              Role
              <input
                type="text"
                name="role"
                placeholder="admin"
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
                disabled={!strapiAvailable}
              />
            </label>
            <div className="flex flex-col gap-2">
              <ActionButton label="Update user" />
              <AdminMessage state={userState} />
            </div>
          </form>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">No users available to manage yet.</p>
        )}
      </section>
    </div>
  );
}
