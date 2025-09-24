import { getSession as resolveSession } from "@/server/auth";

export const getSession = resolveSession;

export async function getUserName() {
  const session = await resolveSession();
  return session.name ?? process.env.NEXT_PUBLIC_USER_NAME ?? "Zenith";
}
