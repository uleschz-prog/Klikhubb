import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { commentSchema } from "@/lib/validations/social";
import { addVideoComment, listVideoComments, SocialError } from "@/lib/video/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await listVideoComments(params.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SocialError && error.code === "NOT_FOUND") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudieron cargar los comentarios." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para comentar." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Escribe un comentario." }, { status: 400 });
  }

  try {
    const result = await addVideoComment(params.id, userId, parsed.data.body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SocialError && error.code === "NOT_FOUND") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo publicar el comentario." }, { status: 500 });
  }
}
