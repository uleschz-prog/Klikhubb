import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { isAllowedVideoUrl, normalizeVideoUrl } from "@/lib/video/naming";
import { publishClip } from "@/lib/video/publish";
import { publishVideoSchema } from "@/lib/validations/video";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para publicar." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = publishVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Falta un video y un texto." }, { status: 400 });
  }

  const videoUrl = normalizeVideoUrl(parsed.data.videoUrl ?? "");
  if (!isAllowedVideoUrl(videoUrl)) {
    return NextResponse.json({ error: "Pega un YouTube, una URL https de un MP4 o un archivo de /videos." }, { status: 400 });
  }

  try {
    const video = await publishClip({
      creatorId: userId,
      caption: parsed.data.caption,
      videoUrl,
      title: parsed.data.title,
      productSlug: parsed.data.productSlug,
      offer: parsed.data.offer,
      lane: parsed.data.lane,
    });
    return NextResponse.json({ ok: true, id: video.id, lane: video.lane });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_YOURS") {
      return NextResponse.json({ error: "Ese producto no es tuyo o no está activo." }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo publicar." }, { status: 500 });
  }
}
