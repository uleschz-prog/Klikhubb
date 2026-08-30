import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles?.includes("ADMIN")) return null;
  return session;
}

export async function requireAdminApi() {
  const session = await getAdminSession();
  if (!session) {
    return { error: NextResponse.json({ error: "No autorizado." }, { status: 403 }) };
  }
  return { session };
}

export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/dashboard");
  return session;
}
