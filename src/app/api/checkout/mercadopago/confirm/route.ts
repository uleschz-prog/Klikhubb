import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { MercadoPagoError, parseExternalReference, settleFromMercadoPagoPaymentId } from "@/lib/payments/mercadopago";

export const runtime = "nodejs";

/** Confirmación al volver de Checkout Pro (payment_id en la query). Idempotente. */
export async function POST(request: Request) {
  const buyerId = await getDbUserId();
  if (!buyerId) {
    return NextResponse.json({ error: "Inicia sesión para confirmar el pago." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    paymentId?: string;
    externalReference?: string;
  } | null;

  const paymentId = body?.paymentId?.trim();
  if (!paymentId) {
    return NextResponse.json({ error: "Falta el id de pago." }, { status: 400 });
  }

  const parsed = parseExternalReference(body?.externalReference);
  if (parsed && parsed.buyerId !== buyerId) {
    return NextResponse.json({ error: "Este pago no es tuyo." }, { status: 403 });
  }

  try {
    const result = await settleFromMercadoPagoPaymentId(paymentId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof MercadoPagoError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 502 });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo confirmar el pago." }, { status: 500 });
  }
}
