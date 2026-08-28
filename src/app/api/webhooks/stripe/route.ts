import { NextResponse } from "next/server";
import { fulfillCheckoutSession } from "@/lib/commerce/stripe";
import { handleConnectAccountUpdated } from "@/lib/commerce/stripe-connect";
import {
  bootstrapStripeWebhookSecrets,
  loadStripeWebhookSecrets,
  verifyStripeWebhookEvent,
} from "@/lib/commerce/stripe-webhook-secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json({ error: "Webhook de Stripe no configurado." }, { status: 501 });
  }

  await bootstrapStripeWebhookSecrets();

  const secrets = await loadStripeWebhookSecrets();

  if (secrets.length === 0) {
    return NextResponse.json({ error: "Webhook de Stripe no configurado." }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta stripe-signature." }, { status: 400 });
  }

  const raw = Buffer.from(await request.arrayBuffer()).toString("utf8");

  let event;
  try {
    event = verifyStripeWebhookEvent(raw, signature, secrets);
  } catch (error) {
    console.error("stripe webhook signature", error);
    const message = error instanceof Error ? error.message : "Firma de webhook inválida.";
    return NextResponse.json(
      {
        error: "Firma de webhook inválida.",
        detail: message,
        hint:
          "Usa el whsec_ del webhook en Stripe Dashboard (Test). No uses stripe listen hacia producción: firma con otro secreto.",
      },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const sessionId = event.data.object.id;
    try {
      const result = await fulfillCheckoutSession(sessionId);
      if (result.unpaid) {
        return NextResponse.json({ received: true, ignored: "unpaid" });
      }
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "No se pudo asentar la venta." }, { status: 500 });
    }
  }

  if (event.type === "account.updated") {
    try {
      await handleConnectAccountUpdated(event.data.object.id);
    } catch (error) {
      console.error(error);
    }
  }

  return NextResponse.json({ received: true });
}
