import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/commerce/stripe";

export type RevokeAccessResult = {
  revoked: boolean;
  buyerId: string | null;
  productId: string | null;
  orderId: string | null;
  enrollmentId: string | null;
  subscriptionCanceled: boolean;
};

/** Quita acceso al curso/producto tras un reembolso o chargeback. Idempotente. */
export async function revokeCourseAccessForRefund(input: {
  buyerId: string;
  productId: string;
  orderId?: string | null;
  note?: string;
}): Promise<RevokeAccessResult> {
  let subscriptionCanceled = false;

  await prisma.$transaction(async (tx) => {
    if (input.orderId) {
      await tx.order.updateMany({
        where: { id: input.orderId, status: "PAID" },
        data: { status: "REFUNDED" },
      });
      await tx.payment.updateMany({
        where: { orderId: input.orderId, status: "SUCCEEDED" },
        data: { status: "REFUNDED" },
      });
    }

    const enrollment = await tx.enrollment.findUnique({
      where: { userId_productId: { userId: input.buyerId, productId: input.productId } },
    });

    if (enrollment && enrollment.status !== "REVOKED") {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { status: "REVOKED" },
      });
    }

    const subscription = await tx.productSubscription.findUnique({
      where: { userId_productId: { userId: input.buyerId, productId: input.productId } },
    });

    if (subscription && subscription.status !== "canceled") {
      await tx.productSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "canceled",
          cancelAtPeriodEnd: true,
          currentPeriodEnd: new Date(),
        },
      });
      subscriptionCanceled = Boolean(subscription.stripeSubscriptionId);
    }
  });

  const subscription = await prisma.productSubscription.findUnique({
    where: { userId_productId: { userId: input.buyerId, productId: input.productId } },
  });

  if (subscriptionCanceled && subscription?.stripeSubscriptionId) {
    try {
      const stripe = getStripe();
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.toLowerCase().includes("canceled")) {
        console.error("stripe subscription cancel on refund", error);
      }
    }
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_productId: { userId: input.buyerId, productId: input.productId } },
  });

  return {
    revoked: enrollment?.status === "REVOKED",
    buyerId: input.buyerId,
    productId: input.productId,
    orderId: input.orderId ?? null,
    enrollmentId: enrollment?.id ?? null,
    subscriptionCanceled,
  };
}

async function resolveOrderFromPaymentIntent(paymentIntentId: string) {
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const buyerId = paymentIntent.metadata?.buyerId ?? null;
  const productId = paymentIntent.metadata?.productId ?? null;

  if (buyerId && productId) {
    const payment = await prisma.payment.findFirst({
      where: {
        provider: "stripe",
        order: {
          buyerId,
          status: "PAID",
          items: { some: { productId } },
        },
      },
      orderBy: { createdAt: "desc" },
      select: { orderId: true, order: { select: { buyerId: true, items: { select: { productId: true }, take: 1 } } } },
    });
    if (payment) {
      return {
        buyerId: payment.order.buyerId,
        productId: payment.order.items[0]?.productId ?? productId,
        orderId: payment.orderId,
      };
    }
    return { buyerId, productId, orderId: null as string | null };
  }

  const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
  const session = sessions.data[0];
  if (!session) return null;

  const payment = await prisma.payment.findUnique({
    where: { provider_providerRef: { provider: "stripe", providerRef: session.id } },
    include: { order: { include: { items: { take: 1 } } } },
  });
  if (!payment?.order) return null;

  return {
    buyerId: payment.order.buyerId,
    productId: payment.order.items[0]?.productId ?? null,
    orderId: payment.order.id,
  };
}

async function resolveOrderFromStripeCharge(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return null;

  const stripe = getStripe();
  const invoiceSearch = await stripe.invoices.search({
    query: `payment_intent:'${paymentIntentId}'`,
    limit: 1,
  });
  const invoiceId = invoiceSearch.data[0]?.id;
  if (invoiceId) {
    const payment = await prisma.payment.findUnique({
      where: { provider_providerRef: { provider: "stripe", providerRef: invoiceId } },
      include: { order: { include: { items: { take: 1 } } } },
    });
    if (payment?.order) {
      return {
        buyerId: payment.order.buyerId,
        productId: payment.order.items[0]?.productId ?? null,
        orderId: payment.order.id,
      };
    }
  }

  return resolveOrderFromPaymentIntent(paymentIntentId);
}

/** Webhook Stripe: reembolso confirmado → revoca acceso al curso. */
export async function handleStripeChargeRefunded(charge: Stripe.Charge) {
  if (!charge.refunded && (charge.amount_refunded ?? 0) <= 0) {
    return { ignored: true as const, reason: "not_refunded" as const };
  }

  const resolved = await resolveOrderFromStripeCharge(charge);
  if (!resolved?.buyerId || !resolved.productId) {
    return { ignored: true as const, reason: "order_not_found" as const };
  }

  const result = await revokeCourseAccessForRefund({
    buyerId: resolved.buyerId,
    productId: resolved.productId,
    orderId: resolved.orderId,
    note: "Reembolso Stripe",
  });

  return { ok: true as const, ...result };
}

/** Webhook Stripe: disputa/chargeback → también revoca acceso. */
export async function handleStripeChargeDisputeCreated(dispute: Stripe.Dispute) {
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
  if (!chargeId) {
    return { ignored: true as const, reason: "no_charge" as const };
  }

  const stripe = getStripe();
  const charge = await stripe.charges.retrieve(chargeId);
  const resolved = await resolveOrderFromStripeCharge(charge);
  if (!resolved?.buyerId || !resolved.productId) {
    return { ignored: true as const, reason: "order_not_found" as const };
  }

  await prisma.order.updateMany({
    where: { id: resolved.orderId ?? undefined, status: "PAID" },
    data: { status: "CHARGEBACK" },
  });

  const result = await revokeCourseAccessForRefund({
    buyerId: resolved.buyerId,
    productId: resolved.productId,
    orderId: resolved.orderId,
    note: "Chargeback Stripe",
  });

  return { ok: true as const, ...result };
}
