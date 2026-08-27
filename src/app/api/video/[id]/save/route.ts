import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { SocialError, toggleVideoSave } from "@/lib/video/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para guardar." }, { status: 401 });
  }

  try {
    const result = await toggleVideoSave(params.id, userId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SocialError) {
      const status = error.code === "NOT_FOUND" ? 404 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo guardar el clip." }, { status: 500 });
  }
}
