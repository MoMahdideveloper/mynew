import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sanitizeSession, createUser, readDatabase, writeDatabase } from "@/server/fsdb";
import { SessionSnapshot, User, UserRole } from "@/types";

const SESSION_COOKIE = "zenith_session";
const ONE_MONTH = 60 * 60 * 24 * 30;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ONE_MONTH,
};

const guestSession: SessionSnapshot = {
  role: "guest",
  name: "Guest",
};

async function setSessionCookie(snapshot: SessionSnapshot) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(sanitizeSession(snapshot)), cookieOptions);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [saltHex, derivedHex] = stored.split(":");
  if (!saltHex || !derivedHex) return false;
  const derived = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  const storedBuf = Buffer.from(derivedHex, "hex");
  return timingSafeEqual(derived, storedBuf);
}

export async function getSession(): Promise<SessionSnapshot> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;
  if (!existing) {
    return guestSession;
  }
  try {
    const snapshot = JSON.parse(existing) as SessionSnapshot;
    if (!snapshot.userId) {
      return sanitizeSession({ ...guestSession, ...snapshot, role: snapshot.role ?? "guest" });
    }
    const db = await readDatabase();
    const user = db.users.find((item) => item.id === snapshot.userId);
    if (!user) {
      await clearSessionCookie();
      return guestSession;
    }
    return {
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    } satisfies SessionSnapshot;
  } catch (error) {
    console.warn("Invalid session cookie", error);
    await clearSessionCookie();
    return guestSession;
  }
}

export async function signUpUser({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const passwordHash = hashPassword(password);
  const user = await createUser({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: "member",
  });
  await setSessionCookie({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });
  return user;
}

export async function signInUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const db = await readDatabase();
  const user = db.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }
  await setSessionCookie({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });
  return user;
}

export async function continueAsGuest(name?: string) {
  await setSessionCookie({
    ...guestSession,
    name: name?.trim() || guestSession.name,
  });
}

export async function signOutUser() {
  await clearSessionCookie();
}

export async function requireAdminSession() {
  const session = await getSession();
  if (session.role !== "admin") {
    redirect("/?auth=admin");
  }
  return session;
}

export async function listUsers() {
  const db = await readDatabase();
  return db.users;
}

export async function findUserById(id: string) {
  const db = await readDatabase();
  return db.users.find((item) => item.id === id) ?? null;
}

export async function setUserRole(id: string, role: UserRole) {
  const db = await readDatabase();
  const index = db.users.findIndex((user) => user.id === id);
  if (index === -1) {
    throw new Error("User not found");
  }
  db.users[index] = {
    ...db.users[index],
    role,
    updatedAt: new Date().toISOString(),
  } satisfies User;
  await writeDatabase(db);
}
