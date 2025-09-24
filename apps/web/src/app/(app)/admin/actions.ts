"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/app/(public)/auth-actions";
import {
  createPost,
  deletePost,
  updatePost,
  updateUserRole,
} from "@/server/strapi";

export interface AdminActionState {
  success?: boolean;
  error?: string;
  message?: string;
}

function refreshSurfaces() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin");
}

export async function createPostAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!title || !slug) {
    return { error: "Title and slug are required." };
  }

  try {
    const post = await createPost(
      {
        title,
        slug,
        excerpt,
        content,
      },
      session.jwt ?? undefined,
    );
    refreshSurfaces();
    return { success: true, message: `Created “${post.title}”.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create the post." };
  }
}

export async function updatePostAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!id) {
    return { error: "Missing post id." };
  }

  try {
    const post = await updatePost(
      id,
      {
        title: title || undefined,
        slug: slug || undefined,
        excerpt: excerpt || undefined,
        content: content || undefined,
      },
      session.jwt ?? undefined,
    );
    refreshSurfaces();
    return { success: true, message: `Updated “${post.title}”.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update the post." };
  }
}

export async function deletePostAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { error: "Missing post id." };
  }

  try {
    await deletePost(id, session.jwt ?? undefined);
    refreshSurfaces();
    return { success: true, message: "Post deleted." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to delete the post." };
  }
}

export async function updateUserRoleAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!userId || !role) {
    return { error: "Select a user and role." };
  }

  try {
    await updateUserRole(userId, role, session.jwt ?? undefined);
    refreshSurfaces();
    return { success: true, message: "User updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update the user." };
  }
}
