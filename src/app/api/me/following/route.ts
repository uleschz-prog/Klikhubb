import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { listFollowingHandles } from "@/lib/video/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  }
  const handles = await listFollowingHandles(userId);
  return NextResponse.json({ handles });
}
