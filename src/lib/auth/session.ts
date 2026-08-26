import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveLiveUserId } from "@/lib/auth/resolve-user";

export function getSession() {
  return getServerSession(authOptions);
}

export async function getDbUserId() {
  const session = await getSession();
  if (!session?.user) return null;
  return resolveLiveUserId(session.user.id, session.user.email);
}
