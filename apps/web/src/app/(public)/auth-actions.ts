"use server";

import { revalidatePath } from "next/cache";

import {
  clearSession,
  createGuestSession,
  createSession,
  getSession,
} from "@/server/session";
import {
  signInWithStrapi,
  signUpWithStrapi,
  isStrapiConfigured,
} from "@/server/strapi";

export interface AuthActionState {
  success?: boolean;
  error?: string;
  message?: string;
}

function revalidateAuthSurfaces() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/blog");
  revalidatePath("/admin");
}

export async function signInAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!identifier || !password) {
    return { error: "Enter your email and password to sign in." };
  }

  if (!isStrapiConfigured()) {
    return { error: "Strapi is not configured. Enable STRAPI_URL to sign in." };
  }

  try {
    const session = await signInWithStrapi(identifier, password);
    await createSession(session);
    revalidateAuthSurfaces();
    return { success: true, message: `Signed in as ${session.user.username}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to sign in." };
  }
}

export async function signUpAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!username || !email || !password) {
    return { error: "Provide a name, email, and password to create an account." };
  }

  if (!isStrapiConfigured()) {
    return { error: "Strapi is not configured. Enable STRAPI_URL to sign up." };
  }

  try {
    const session = await signUpWithStrapi(username, email, password);
    await createSession(session);
    revalidateAuthSurfaces();
    return { success: true, message: `Welcome aboard, ${session.user.username}!` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create an account." };
  }
}

export async function continueAsGuestAction() {
  const current = await getSession();
  if (current?.user.role === "guest") {
    return;
  }
  await createSession(createGuestSession());
  revalidateAuthSurfaces();
}

export async function signOutAction() {
  await clearSession();
  revalidateAuthSurfaces();
}

export async function requireAdminSession() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Admin privileges are required for this action.");
  }
  return session;
}

