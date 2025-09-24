import "server-only";
import { cookies } from "next/headers";

const SESSION_COOKIE = "zenith-session";

export type SessionRole = "guest" | "user" | "admin" | string;

export interface SessionUser {
  id: string;
  username: string;
  email?: string;
  role: SessionRole;
}

export interface AuthSession {
  jwt: string | null;
  user: SessionUser;
}

function decodeSession(value: string): AuthSession | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(json) as AuthSession;
  } catch (error) {
    console.error("Failed to decode session cookie", error);
    return null;
  }
}

function encodeSession(session: AuthSession): string {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export async function getSession(): Promise<AuthSession | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  if (!value) {
    return null;
  }
  return decodeSession(value);
}

export async function getCurrentUser(): Promise<SessionUser> {
  const session = await getSession();
  if (session?.user) {
    return session.user;
  }
  const fallbackName = process.env.NEXT_PUBLIC_USER_NAME ?? "Zenith";
  return {
    id: "guest",
    username: fallbackName,
    role: "guest",
  };
}

export async function getUserName() {
  return (await getCurrentUser()).username;
}

export async function createSession(session: AuthSession) {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function createGuestSession(username = "Guest") {
  return {
    jwt: null,
    user: {
      id: "guest",
      username,
      role: "guest" as SessionRole,
    },
  } satisfies AuthSession;
}
