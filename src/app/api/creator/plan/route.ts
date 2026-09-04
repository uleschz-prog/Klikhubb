import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import {
  CreatorPlanError,
  getCreatorPlanSnapshot,
  submitCreatorPlanProof,
  switchCreatorPlan,
} from "@/lib/commerce/creator-plan-billing";
import type { CreatorPlanCode } from "@/lib/commerce/creator-plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const snapshot = await getCreatorPlanSnapshot(userId);
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { action?: string; plan?: string; invoiceId?: string; proofUrl?: string; proofNote?: string }
    | null;

  try {
    if (body?.action === "switch") {
      const plan = body.plan === "flat" ? "flat" : body.plan === "payg" ? "payg" : null;
      if (!plan) return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
      const snapshot = await switchCreatorPlan({ userId, plan: plan as CreatorPlanCode });
      return NextResponse.json(snapshot);
    }

    if (body?.action === "proof") {
      if (!body.invoiceId) {
        return NextResponse.json({ error: "Falta la factura." }, { status: 400 });
      }
      const snapshot = await submitCreatorPlanProof({
        userId,
        invoiceId: body.invoiceId,
        proofUrl: body.proofUrl,
        proofNote: body.proofNote,
      });
      return NextResponse.json(snapshot);
    }

    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  } catch (error) {
    if (error instanceof CreatorPlanError) {
      const status =
        error.code === "FORBIDDEN"
          ? 403
          : error.code === "NOT_FOUND"
            ? 404
            : error.code === "NOT_CONFIGURED"
              ? 503
              : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo actualizar el plan." }, { status: 500 });
  }
}
