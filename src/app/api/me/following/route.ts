import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listFollowingHandles } from "@/lib/video/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  }
  const handles = await listFollowingHandles(userId);
  return NextResponse.json({ handles });
}
