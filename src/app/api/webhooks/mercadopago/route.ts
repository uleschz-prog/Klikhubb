import { NextResponse } from "next/server";
import { CommerceError } from "@/lib/commerce/settle-order";
import {
  extractPaymentIdFromWebhook,
  MercadoPagoError,
  settleFromMercadoPagoPaymentId,
  verifyMercadoPagoWebhookSignature,
} from "@/lib/payments/mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook / IPN de Mercado Pago.
 * Confirma el pago vía API y asienta con settlePaidOrder (idempotente por payment id).
 */
export async function POST(request: Request) {
  return handleNotification(request);
}

/** Algunos entornos envían GET con topic/id (IPN legacy). */
export async function GET(request: Request) {
  return handleNotification(request);
}

async function handleNotification(request: Request) {
  const url = new URL(request.url);
  let body: unknown = null;
  if (request.method === "POST") {
    body = await request.json().catch(() => null);
  }

  const paymentId = extractPaymentIdFromWebhook({
    query: url.searchParams,
    body,
  });

  if (!paymentId) {
    return NextResponse.json({ ok: true, ignored: true, reason: "no_payment_id" });
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const dataIdForSig = url.searchParams.get("data.id") || paymentId;

  if (
    !verifyMercadoPagoWebhookSignature({
      xSignature,
      xRequestId,
      dataId: dataIdForSig,
    })
  ) {
    console.warn("[mercadopago] webhook firma inválida", { paymentId });
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  try {
    const result = await settleFromMercadoPagoPaymentId(paymentId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof MercadoPagoError) {
      console.error("[mercadopago] webhook", error.message);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    if (error instanceof CommerceError) {
      console.warn("[mercadopago] settle commerce", error.code, error.message);
      return NextResponse.json({ ok: false, code: error.code, error: error.message });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al procesar notificación" }, { status: 500 });
  }
}
