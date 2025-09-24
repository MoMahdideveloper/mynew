"use client";

import { useFormState, useFormStatus } from "react-dom";
import { BlogPost } from "@/types";
import { deleteBlogPostAction, saveBlogPostAction } from "@/server/actions";
import { ActionResult, idleActionResult } from "@/lib/action-result";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-surface transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-border"
      disabled={pending}
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

function DangerButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-lg border border-negative/40 px-3 py-2 text-sm font-semibold text-negative hover:bg-negative/10 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Working..." : label}
    </button>
  );
}

function FormMessage({ state }: { state: ActionResult }) {
  if (state.status === "idle") return null;
  const styles =
    state.status === "error"
      ? "text-negative bg-negative/10"
      : "text-positive bg-positive/10";
  return (
    <p className={`mt-3 rounded-md px-3 py-2 text-sm font-medium ${styles}`}>{state.message}</p>
  );
}

export function PostEditor({ post }: { post?: BlogPost }) {
  const [state, dispatch] = useFormState(saveBlogPostAction, idleActionResult);
  const [deleteState, deleteDispatch] = useFormState(deleteBlogPostAction, idleActionResult);
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/60 p-6 shadow-sm">
      <form action={dispatch} className="space-y-4">
        {post && <input type="hidden" name="id" value={post.id} />}
        {post?.externalId && <input type="hidden" name="externalId" value={post.externalId} />}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col">
            <label htmlFor={`title-${post?.id ?? "new"}`} className="text-sm font-medium text-ink">
              Title
            </label>
            <input
              id={`title-${post?.id ?? "new"}`}
              name="title"
              defaultValue={post?.title ?? ""}
              required
              className="mt-1 rounded-lg border border-border/60 bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor={`slug-${post?.id ?? "new"}`} className="text-sm font-medium text-ink">
              Slug
            </label>
            <input
              id={`slug-${post?.id ?? "new"}`}
              name="slug"
              defaultValue={post?.slug ?? ""}
              required
              className="mt-1 rounded-lg border border-border/60 bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex flex-col">
          <label htmlFor={`excerpt-${post?.id ?? "new"}`} className="text-sm font-medium text-ink">
            Excerpt
          </label>
          <textarea
            id={`excerpt-${post?.id ?? "new"}`}
            name="excerpt"
            defaultValue={post?.excerpt ?? ""}
            required
            className="mt-1 min-h-[80px] rounded-lg border border-border/60 bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor={`content-${post?.id ?? "new"}`} className="text-sm font-medium text-ink">
            Content (HTML)
          </label>
          <textarea
            id={`content-${post?.id ?? "new"}`}
            name="content"
            defaultValue={post?.content ?? ""}
            required
            className="mt-1 min-h-[160px] rounded-lg border border-border/60 bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col">
            <label htmlFor={`cover-${post?.id ?? "new"}`} className="text-sm font-medium text-ink">
              Cover image URL (optional)
            </label>
            <input
              id={`cover-${post?.id ?? "new"}`}
              name="coverImage"
              defaultValue={post?.coverImage ?? ""}
              className="mt-1 rounded-lg border border-border/60 bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor={`published-${post?.id ?? "new"}`} className="text-sm font-medium text-ink">
              Published at (ISO)
            </label>
            <input
              id={`published-${post?.id ?? "new"}`}
              name="publishedAt"
              defaultValue={post?.publishedAt ?? ""}
              placeholder={new Date().toISOString()}
              className="mt-1 rounded-lg border border-border/60 bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SubmitButton label={post ? "Save changes" : "Publish post"} />
        </div>
        <FormMessage state={state} />
      </form>
      {post && (
        <form action={deleteDispatch} className="mt-4 inline-flex items-center gap-3">
          <input type="hidden" name="id" value={post.id} />
          <DangerButton label="Delete" />
          <FormMessage state={deleteState} />
        </form>
      )}
    </div>
  );
}
