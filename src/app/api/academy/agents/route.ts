import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { requireAcademyMember } from "@/lib/academy/membership";
import { runAcademyAgent } from "@/lib/academy/generate";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  goal: z.string().trim().min(8).max(2000),
});

export async function GET() {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const runs = await prisma.academyAgentRun.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({
    runs: runs.map((run) => ({
      id: run.id,
      goal: run.goal,
      plan: run.plan,
      result: run.result,
      status: run.status,
      createdAt: run.createdAt.toISOString(),
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
    return NextResponse.json({ error: "Describe el objetivo del agente." }, { status: 400 });
  }

  try {
    const output = await runAcademyAgent(parsed.data.goal);
    const run = await prisma.academyAgentRun.create({
      data: {
        userId,
        goal: parsed.data.goal,
        plan: output.plan,
        result: output.result,
        status: "DONE",
        creditCost: 0,
      },
    });
    await prisma.academyArtifact.create({
      data: {
        userId,
        kind: "AGENT",
        title: parsed.data.goal.slice(0, 80),
        prompt: parsed.data.goal,
        output: output.result,
        creditCost: 0,
      },
    });
    return NextResponse.json({
      ok: true,
      run: {
        id: run.id,
        goal: run.goal,
        plan: run.plan,
        result: run.result,
        status: run.status,
        createdAt: run.createdAt.toISOString(),
        steps: output.steps,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "El agente no pudo completar la tarea." }, { status: 502 });
  }
}
