import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbUserId } from "@/lib/auth/session";
import { ReviewError, upsertProductReview } from "@/lib/commerce/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(400).optional(),
});

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para opinar." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Opinión no válida." }, { status: 400 });
  }

  try {
    const item = await upsertProductReview(userId, params.slug, {
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (error instanceof ReviewError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo guardar la opinión." }, { status: 500 });
  }
}
