import { NextResponse } from "next/server";
import { handleStripeChargeRefunded } from "@/lib/commerce/refunds";
import { fulfillCheckoutSession, fulfillStripeInvoice, expireStripeAcademySubscription, getStripe, isStripeEnabled } from "@/lib/commerce/stripe";
import { handleConnectAccountUpdated } from "@/lib/commerce/stripe-connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "Webhook de Stripe no configurado." }, { status: 501 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Falta STRIPE_WEBHOOK_SECRET." }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta stripe-signature." }, { status: 400 });
  }

  const raw = Buffer.from(await request.arrayBuffer()).toString("utf8");
  let event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch (error) {
    console.error("stripe webhook signature", error);
    return NextResponse.json({ error: "Firma de webhook inválida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    try {
      const result = await fulfillCheckoutSession(session.id);
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

  if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
    try {
      await fulfillStripeInvoice(event.data.object);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "No se pudo asentar la renovación." }, { status: 500 });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    try {
      await expireStripeAcademySubscription(event.data.object);
    } catch (error) {
      console.error(error);
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const paymentIntentId =
      typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id ?? null;
    try {
      await handleStripeChargeRefunded(paymentIntentId);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "No se pudo revocar el acceso del reembolso." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
