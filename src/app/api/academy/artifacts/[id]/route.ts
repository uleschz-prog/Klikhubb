import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { requireAcademyMember } from "@/lib/academy/membership";
import { AcademyAiError, settleAcademyVideo, type AcademyMedia } from "@/lib/academy/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseMedia(raw: string): AcademyMedia | null {
  try {
    return JSON.parse(raw) as AcademyMedia;
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    await requireAcademyMember(userId);
  } catch {
    return NextResponse.json({ error: "Membresía inactiva.", code: "ACADEMY_INACTIVE" }, { status: 402 });
  }

  const artifact = await prisma.academyArtifact.findFirst({
    where: { id: params.id, userId },
  });
  if (!artifact) return NextResponse.json({ error: "No encontrado." }, { status: 404 });

  let output = parseMedia(artifact.output);
  if (output?.kind === "processing" && output.jobId) {
    try {
      const settled = await settleAcademyVideo({ jobId: output.jobId, pollingUrl: output.pollingUrl });
      if (settled) {
        output = settled;
        await prisma.academyArtifact.update({
          where: { id: artifact.id },
          data: { output: JSON.stringify(settled) },
        });
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof AcademyAiError ? error.message : "El video sigue procesándose.";
      return NextResponse.json({ error: message, artifact: serialize(artifact, output) }, { status: 502 });
    }
  }

  return NextResponse.json({
    ok: true,
    pending: output?.kind === "processing",
    artifact: serialize(artifact, output),
  });
}

function serialize(
  artifact: { id: string; kind: string; title: string; prompt: string; createdAt: Date },
  output: AcademyMedia | null,
) {
  return {
    id: artifact.id,
    kind: artifact.kind,
    title: artifact.title,
    prompt: artifact.prompt,
    output: output ?? {},
    createdAt: artifact.createdAt.toISOString(),
  };
}
