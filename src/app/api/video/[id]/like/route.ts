import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { SocialError, toggleVideoLike } from "@/lib/video/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para dar like." }, { status: 401 });
  }

  try {
    const result = await toggleVideoLike(params.id, userId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SocialError && error.code === "NOT_FOUND") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo guardar el like." }, { status: 500 });
  }
}
