import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { requireAcademyMember } from "@/lib/academy/membership";
import { generateAcademyImage, generateAcademyVideo } from "@/lib/academy/generate";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  kind: z.enum(["image", "video"]),
  prompt: z.string().trim().min(8).max(2000),
  title: z.string().trim().max(160).optional(),
});

export async function POST(request: Request) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para usar Qlyk Academy." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Describe con más detalle lo que quieres crear." }, { status: 400 });
  }

  try {
    await requireAcademyMember(userId);
  } catch {
    return NextResponse.json({ error: "Necesitas una membresía activa de Qlyk Academy.", code: "ACADEMY_INACTIVE" }, { status: 402 });
  }

  const title = parsed.data.title?.trim() || parsed.data.prompt.slice(0, 80);

  try {
    const output =
      parsed.data.kind === "image"
        ? await generateAcademyImage(parsed.data.prompt)
        : await generateAcademyVideo(parsed.data.prompt);

    const artifact = await prisma.academyArtifact.create({
      data: {
        userId,
        kind: parsed.data.kind === "image" ? "IMAGE" : "VIDEO",
        title,
        prompt: parsed.data.prompt,
        output: JSON.stringify(output),
        creditCost: 0,
      },
    });

    return NextResponse.json({
      ok: true,
      artifact: {
        id: artifact.id,
        kind: artifact.kind,
        title: artifact.title,
        prompt: artifact.prompt,
        output,
        createdAt: artifact.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo generar ahora. Inténtalo de nuevo." }, { status: 502 });
  }
}
