import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { followSchema } from "@/lib/validations/social";
import { SocialError, toggleFollowByHandle } from "@/lib/video/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para seguir." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = followSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Falta el creador." }, { status: 400 });
  }

  try {
    const result = await toggleFollowByHandle(userId, parsed.data.handle);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SocialError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "SELF" ? 400 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo actualizar el follow." }, { status: 500 });
  }
}
