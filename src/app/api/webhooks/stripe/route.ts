import { NextResponse } from "next/server";
import { fulfillCheckoutSession, getStripe } from "@/lib/commerce/stripe";
import { handleConnectAccountUpdated } from "@/lib/commerce/stripe-connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Webhook de Stripe no configurado." }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta stripe-signature." }, { status: 400 });
  }

  const raw = await request.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch {
    return NextResponse.json({ error: "Firma de webhook inválida." }, { status: 400 });
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
