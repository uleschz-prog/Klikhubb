import { NextResponse } from "next/server";
import { getMercadoPagoWebhookSecret } from "@/lib/env";
import {
  MercadoPagoNotConfiguredError,
  verifyApprovedContractPayment,
} from "@/lib/mercadopago";

export async function POST(request: Request) {
  const secret = getMercadoPagoWebhookSecret();
  const provided =
    request.headers.get("x-signature") ??
    request.headers.get("x-hub-signature") ??
    new URL(request.url).searchParams.get("secret");

  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  let payload: {
    data?: { id?: string | number };
    type?: string;
    action?: string;
  };

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ received: true });
  }

  const paymentId = payload.data?.id ? String(payload.data.id) : null;
  if (!paymentId) {
    return NextResponse.json({ received: true });
  }

  try {
    const verified = await verifyApprovedContractPayment(paymentId);
    return NextResponse.json({
      received: true,
      approved: Boolean(verified),
      paymentId,
    });
  } catch (error) {
    if (error instanceof MercadoPagoNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ received: true, paymentId });
  }
}
