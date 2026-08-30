import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AdminPayoutError,
  completeManualPayout,
  listPendingManualPayouts,
  rejectManualPayout,
} from "@/lib/commerce/admin-payouts";
import { requireAdminApi } from "@/lib/auth/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const payouts = await listPendingManualPayouts();
  return NextResponse.json({ payouts });
}

const actionSchema = z.object({
  payoutId: z.string().min(1),
  action: z.enum(["complete", "reject"]),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body: unknown = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const { payoutId, action, note } = parsed.data;

  try {
    if (action === "complete") {
      const payout = await completeManualPayout(payoutId, note);
      return NextResponse.json({ ok: true, payoutId: payout.id, status: payout.status });
    }

    const payout = await rejectManualPayout(payoutId, note ?? "Retiro rechazado por operaciones.");
    return NextResponse.json({ ok: true, payoutId: payout.id, status: payout.status });
  } catch (error) {
    if (error instanceof AdminPayoutError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo actualizar el retiro." }, { status: 500 });
  }
}
