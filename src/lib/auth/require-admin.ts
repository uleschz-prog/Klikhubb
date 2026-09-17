import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { PLATFORM_ADMIN, isPlatformAdminIdentity } from "@/config/platform-admin";
import { prisma } from "@/lib/prisma";

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles?.includes("ADMIN")) return null;
  return session;
}

export async function isPlatformAdministrator(session: { user?: { id?: string; email?: string | null } }) {
  const email = session.user?.email?.trim().toLowerCase();
  if (email === PLATFORM_ADMIN.email) return true;
  const userId = session.user?.id;
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, username: true, referralCode: true },
  });
  if (!user) return false;
  return isPlatformAdminIdentity(user);
}

export async function requireAdminApi() {
  const session = await getAdminSession();
  if (!session) {
    return { error: NextResponse.json({ error: "No autorizado." }, { status: 403 }) };
  }
  return { session };
}

export async function requirePlatformAdminApi() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth;
  if (!(await isPlatformAdministrator(auth.session))) {
    return { error: NextResponse.json({ error: "Solo la cuenta administradora puede hacer esto." }, { status: 403 }) };
  }
  return auth;
}

export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/dashboard");
  return session;
}

export async function requirePlatformAdminPage() {
  const session = await requireAdminPage();
  if (!(await isPlatformAdministrator(session))) redirect("/dashboard");
  return session;
}
