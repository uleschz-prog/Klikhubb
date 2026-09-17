import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { requireAcademyMember } from "@/lib/academy/membership";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  title: z.string().trim().min(2).max(160),
});

export async function GET() {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    await requireAcademyMember(userId);
  } catch {
    return NextResponse.json({ error: "Membresía inactiva.", code: "ACADEMY_INACTIVE" }, { status: 402 });
  }

  const rows = await prisma.academyNotebook.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 40,
    select: { id: true, title: true, updatedAt: true, _count: { select: { sources: true, turns: true } } },
  });
  return NextResponse.json({
    notebooks: rows.map((row) => ({
      id: row.id,
      title: row.title,
      updatedAt: row.updatedAt.toISOString(),
      sources: row._count.sources,
      turns: row._count.turns,
    })),
  });
}

export async function POST(request: Request) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    await requireAcademyMember(userId);
  } catch {
    return NextResponse.json({ error: "Membresía inactiva.", code: "ACADEMY_INACTIVE" }, { status: 402 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ponle un título al notebook." }, { status: 400 });
  }

  const notebook = await prisma.academyNotebook.create({
    data: { userId, title: parsed.data.title, body: "" },
  });
  return NextResponse.json({
    ok: true,
    notebook: { id: notebook.id, title: notebook.title, body: notebook.body, sources: [], turns: [] },
  });
}
