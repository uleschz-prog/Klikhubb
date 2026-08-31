import { NextResponse } from "next/server";
import { fulfillCheckoutSession } from "@/lib/commerce/stripe";
import { handleConnectAccountUpdated } from "@/lib/commerce/stripe-connect";
import {
  handleSubscriptionDeleted,
  handleSubscriptionInvoicePaid,
  handleSubscriptionUpdated,
} from "@/lib/commerce/subscriptions";
import { prisma } from "@/lib/prisma";
import {
  loadStripeWebhookSecrets,
  STRIPE_WEBHOOK_SECRET_KEY,
  syncStripeWebhookEndpoint,
  verifyStripeWebhookEvent,
} from "@/lib/commerce/stripe-webhook-secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json({ error: "Webhook de Stripe no configurado." }, { status: 501 });
  }

  try {
    const stored = await prisma.platformSecret.findUnique({
      where: { key: STRIPE_WEBHOOK_SECRET_KEY },
    });
    if (!stored?.value?.trim()) {
      await syncStripeWebhookEndpoint({ force: true });
    }
  } catch (error) {
    console.error("stripe webhook pre-sync", error);
  }

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
    return NextResponse.json({ error: "Firma de webhook inválida.", detail: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.mode === "subscription") {
      return NextResponse.json({ received: true, ignored: "subscription_via_invoice" });
    }
    const sessionId = session.id;
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

  if (event.type === "invoice.paid") {
    try {
      await handleSubscriptionInvoicePaid(event.data.object);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "No se pudo asentar la suscripción." }, { status: 500 });
    }
  }

  if (event.type === "customer.subscription.updated") {
    try {
      await handleSubscriptionUpdated(event.data.object);
    } catch (error) {
      console.error(error);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    try {
      await handleSubscriptionDeleted(event.data.object);
    } catch (error) {
      console.error(error);
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
