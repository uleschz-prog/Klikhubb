import { NextResponse } from "next/server";
import { CommerceError } from "@/lib/commerce/settle-order";
import {
  extractPaymentIdFromWebhook,
  signatureDataId,
} from "@/lib/payments/mp-signature";
import {
  isWebhookSignatureAuthorized,
  MercadoPagoError,
  settleFromMercadoPagoPaymentId,
} from "@/lib/payments/mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleNotification(request);
}

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

  const authorized = isWebhookSignatureAuthorized({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId: signatureDataId({ query: url.searchParams, paymentId }),
  });

  if (!authorized) {
    console.warn("[mercadopago] webhook firma inválida", { paymentId });
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  try {
    const result = await settleFromMercadoPagoPaymentId(paymentId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof MercadoPagoError) {
      console.error("[mercadopago] webhook", error.message);
      const status = error.code === "INVALID_SIGNATURE" ? 401 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    if (error instanceof CommerceError) {
      console.warn("[mercadopago] settle commerce", error.code, error.message);
      // 200 para que MP no reintente en ya-owned / conflictos de negocio
      return NextResponse.json({ ok: false, code: error.code, error: error.message });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al procesar notificación" }, { status: 500 });
  }
}
