import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin";
import { getDbUserId } from "@/lib/auth/session";
import {
  approveManualPayment,
  listPendingManualPayments,
  ManualPaymentError,
  rejectManualPayment,
  revokeManualPaymentAccess,
} from "@/lib/commerce/manual-payments";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "revoke"]),
  requestId: z.string().min(1),
  note: z.string().max(500).optional(),
});

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const rows = await listPendingManualPayments();
  return NextResponse.json({ rows });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const reviewerId = await getDbUserId();
  if (!reviewerId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  }

  try {
    if (parsed.data.action === "approve") {
      const result = await approveManualPayment({
        requestId: parsed.data.requestId,
        reviewerId: reviewerId,
        note: parsed.data.note,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (parsed.data.action === "reject") {
      const note = parsed.data.note?.trim();
      if (!note) {
        return NextResponse.json({ error: "Escribe el motivo del rechazo." }, { status: 400 });
      }
      const result = await rejectManualPayment({
        requestId: parsed.data.requestId,
        reviewerId: reviewerId,
        note,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    const note = parsed.data.note?.trim();
    if (!note) {
      return NextResponse.json({ error: "Escribe el motivo de la revocación." }, { status: 400 });
    }
    const result = await revokeManualPaymentAccess({
      requestId: parsed.data.requestId,
      reviewerId: reviewerId,
      note,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ManualPaymentError) {
      const status =
        error.code === "NOT_FOUND" ? 404 : error.code === "INVALID_STATE" ? 409 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo procesar la acción." }, { status: 500 });
  }
}
