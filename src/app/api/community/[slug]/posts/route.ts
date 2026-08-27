import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { CommunityError, createCommunityPost } from "@/lib/community";
import { communityPostSchema } from "@/lib/validations/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para publicar." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = communityPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Escribe un post." }, { status: 400 });
  }

  try {
    const post = await createCommunityPost(userId, params.slug, parsed.data);
    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof CommunityError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo publicar." }, { status: 500 });
  }
}
