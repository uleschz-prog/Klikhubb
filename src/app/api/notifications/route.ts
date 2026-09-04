import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import {
  listNotifications,
  markNotificationsRead,
  unreadNotificationCount,
} from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const [items, unread] = await Promise.all([
    listNotifications(userId),
    unreadNotificationCount(userId),
  ]);
  return NextResponse.json({ items, unread });
}

export async function POST(request: Request) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { ids?: string[] } | null;
  await markNotificationsRead(userId, body?.ids);
  return NextResponse.json({ ok: true });
}
