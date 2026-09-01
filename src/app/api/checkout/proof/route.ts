import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { ManualPaymentError, submitManualPaymentProof } from "@/lib/commerce/manual-payments";
import { z } from "zod";

export const runtime = "nodejs";

const proofSchema = z.object({
  requestId: z.string().min(1),
  proofUrl: z.string().url().optional().nullable(),
  proofNote: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  const buyerId = await getDbUserId();
  if (!buyerId) {
    return NextResponse.json({ error: "Inicia sesión para enviar el comprobante." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = proofSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de comprobante no válidos." }, { status: 400 });
  }

  try {
    const result = await submitManualPaymentProof({
      requestId: parsed.data.requestId,
      buyerId,
      proofUrl: parsed.data.proofUrl,
      proofNote: parsed.data.proofNote,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ManualPaymentError) {
      const status =
        error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo enviar el comprobante." }, { status: 500 });
  }
}
