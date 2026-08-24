import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { publishVideoSchema } from "@/lib/validations/video";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para publicar." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = publishVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Falta un video y un texto." }, { status: 400 });
  }

  const videoUrl = parsed.data.videoUrl!;
  if (!/^https:\/\//i.test(videoUrl)) {
    return NextResponse.json({ error: "El video tiene que ser una URL https." }, { status: 400 });
  }

  const title = (parsed.data.title?.trim() || parsed.data.caption).slice(0, 120);
  const productSlug = parsed.data.productSlug?.trim();

  let productId: string | null = null;
  if (productSlug) {
    const product = await prisma.product.findFirst({
      where: { slug: productSlug, creatorId: userId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Ese producto no es tuyo o no está activo." }, { status: 400 });
    }
    productId = product.id;
  }

  const video = await prisma.video.create({
    data: {
      creatorId: userId,
      title,
      caption: parsed.data.caption,
      videoUrl,
      status: "PUBLISHED",
      publishedAt: new Date(),
      ...(productId
        ? {
            products: {
              create: { productId, isPrimary: true, ctaLabel: "Comprar" },
            },
          }
        : {}),
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: video.id });
}
