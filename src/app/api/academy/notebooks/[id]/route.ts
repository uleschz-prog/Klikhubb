import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { requireAcademyMember } from "@/lib/academy/membership";
import { AcademyAiError, runAcademyNotebook } from "@/lib/academy/generate";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("source"),
    title: z.string().trim().min(2).max(160),
    content: z.string().trim().min(12).max(20_000),
  }),
  z.object({
    action: z.literal("ask"),
    question: z.string().trim().min(4).max(2000),
  }),
]);

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const notebook = await prisma.academyNotebook.findFirst({
    where: { id: params.id, userId },
    include: {
      sources: { orderBy: { createdAt: "asc" } },
      turns: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!notebook) return NextResponse.json({ error: "Notebook no encontrado." }, { status: 404 });
  return NextResponse.json({ notebook: serialize(notebook) });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    await requireAcademyMember(userId);
  } catch {
    return NextResponse.json({ error: "Membresía inactiva.", code: "ACADEMY_INACTIVE" }, { status: 402 });
  }

  const notebook = await prisma.academyNotebook.findFirst({
    where: { id: params.id, userId },
    include: {
      sources: { orderBy: { createdAt: "asc" } },
      turns: { orderBy: { createdAt: "asc" }, take: 16 },
    },
  });
  if (!notebook) return NextResponse.json({ error: "Notebook no encontrado." }, { status: 404 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  }

  if (parsed.data.action === "source") {
    await prisma.academyNotebookSource.create({
      data: { notebookId: notebook.id, title: parsed.data.title, content: parsed.data.content },
    });
    const fresh = await prisma.academyNotebook.findUniqueOrThrow({
      where: { id: notebook.id },
      include: { sources: { orderBy: { createdAt: "asc" } }, turns: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ ok: true, notebook: serialize(fresh) });
  }

  try {
    const answer = await runAcademyNotebook({
      question: parsed.data.question,
      sources: notebook.sources,
      history: notebook.turns,
    });
    await prisma.$transaction([
      prisma.academyNotebookTurn.create({
        data: { notebookId: notebook.id, role: "user", content: parsed.data.question },
      }),
      prisma.academyNotebookTurn.create({
        data: { notebookId: notebook.id, role: "assistant", content: answer },
      }),
      prisma.academyNotebook.update({
        where: { id: notebook.id },
        data: { body: answer.slice(0, 8000) },
      }),
    ]);
    const fresh = await prisma.academyNotebook.findUniqueOrThrow({
      where: { id: notebook.id },
      include: { sources: { orderBy: { createdAt: "asc" } }, turns: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ ok: true, notebook: serialize(fresh) });
  } catch (error) {
    console.error(error);
    const message = error instanceof AcademyAiError ? error.message : "No se pudo consultar el notebook.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function serialize(notebook: {
  id: string;
  title: string;
  body: string;
  sources: { id: string; title: string; content: string }[];
  turns: { id: string; role: string; content: string; createdAt: Date }[];
}) {
  return {
    id: notebook.id,
    title: notebook.title,
    body: notebook.body,
    sources: notebook.sources.map((source) => ({ id: source.id, title: source.title, content: source.content })),
    turns: notebook.turns.map((turn) => ({
      id: turn.id,
      role: turn.role,
      content: turn.content,
      createdAt: turn.createdAt.toISOString(),
    })),
  };
}
