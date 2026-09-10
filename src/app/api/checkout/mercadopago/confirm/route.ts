import { NextResponse } from "next/server";
import { getDbUserId, getSession } from "@/lib/auth/session";
import { CommerceError } from "@/lib/commerce/settle-order";
import {
  MercadoPagoError,
  settleFromMercadoPagoPaymentId,
} from "@/lib/payments/mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tras el redirect de Checkout Pro, el comprador puede confirmar el pago
 * si el webhook aún no corrió (misma lógica idempotente).
 */
export async function POST(request: Request) {
  const session = await getSession();
  const buyerId = await getDbUserId();
  if (!session?.user || !buyerId) {
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { paymentId?: string } | null;
  const paymentId = body?.paymentId?.trim();
  if (!paymentId) {
    return NextResponse.json({ error: "Falta paymentId." }, { status: 400 });
  }

  try {
    const result = await settleFromMercadoPagoPaymentId(paymentId);
    return NextResponse.json({
      ok: true,
      settled: result.settled,
      orderId: result.settled ? result.orderId : undefined,
      paymentId: result.paymentId,
      status: result.status,
      statusDetail: result.settled ? undefined : result.statusDetail,
    });
  } catch (error) {
    if (error instanceof CommerceError) {
      const status = error.code === "ALREADY_OWNED" ? 409 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    if (error instanceof MercadoPagoError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 502 });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo confirmar el pago." }, { status: 500 });
  }
}
