import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { AcademyHubNav } from "@/components/academy/AcademyHubNav";
import { AcademyStudioClient } from "@/components/academy/AcademyStudioClient";
import { AcademySubscribeButton } from "@/components/academy/AcademySubscribeButton";
import { getDbUserId } from "@/lib/auth/session";
import { loadAcademySnapshot } from "@/lib/academy/membership";
import { prisma } from "@/lib/prisma";
import { ensureAcademyProduct } from "@/lib/academy/product";

export const dynamic = "force-dynamic";

export default async function AcademyStudioPage() {
  const userId = await getDbUserId();
  if (!userId) redirect(`/login?callbackUrl=${encodeURIComponent("/academy/studio")}`);

  await ensureAcademyProduct().catch(() => undefined);
  const snapshot = await loadAcademySnapshot(userId);

  if (!snapshot?.active) {
    return (
      <PlatformShell title="Estudio IA">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Qlyk Academy</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Estudio de IA</h1>
        <p className="mt-2 max-w-xl text-sm text-white/55">
          Esta sala es para alumnos activos. Con USD 50 al mes tienes acceso ilimitado al estudio.
        </p>
        <AcademyHubNav />
        <div className="mt-8">
          <AcademySubscribeButton />
        </div>
      </PlatformShell>
    );
  }

  let artifacts: Awaited<ReturnType<typeof prisma.academyArtifact.findMany>> = [];
  let notebooks: {
    id: string;
    title: string;
    updatedAt: Date;
    _count: { sources: number; turns: number };
  }[] = [];
  let agents: Awaited<ReturnType<typeof prisma.academyAgentRun.findMany>> = [];
  try {
    [artifacts, notebooks, agents] = await Promise.all([
      prisma.academyArtifact.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.academyNotebook.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 40,
        select: { id: true, title: true, updatedAt: true, _count: { select: { sources: true, turns: true } } },
      }),
      prisma.academyAgentRun.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);
  } catch {
    artifacts = [];
    notebooks = [];
    agents = [];
  }

  return (
    <PlatformShell title="Estudio IA">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Qlyk Academy</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Estudio de IA</h1>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        Imagen, video, Notebook LM y agentes autónomos. Ilimitado mientras tu membresía esté activa.
      </p>
      <AcademyHubNav />
      <AcademyStudioClient
        artifacts={artifacts.map((row) => ({
          id: row.id,
          kind: row.kind,
          title: row.title,
          prompt: row.prompt,
          output: row.output,
          createdAt: row.createdAt.toISOString(),
        }))}
        notebooks={notebooks.map((row) => ({
          id: row.id,
          title: row.title,
          updatedAt: row.updatedAt.toISOString(),
          sources: row._count.sources,
          turns: row._count.turns,
        }))}
        agents={agents.map((row) => ({
          id: row.id,
          goal: row.goal,
          plan: row.plan,
          result: row.result,
          createdAt: row.createdAt.toISOString(),
        }))}
      />
    </PlatformShell>
  );
}
