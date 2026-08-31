import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { resolveLiveUserId } from "@/lib/auth/resolve-user";
import { isSubscriptionAccessActive } from "@/lib/commerce/billing";
import { CommerceError, settlePaidOrder } from "@/lib/commerce/settle-order";
import { getStripe } from "@/lib/commerce/stripe";
import { demoSettleOrder, shouldUseDemoFallback } from "@/lib/demo/store";

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent?.subscription_details?.subscription;
  if (typeof parent === "string") return parent;
  if (parent && typeof parent === "object") return parent.id;

  const legacy = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }).subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy && typeof legacy === "object") return legacy.id;
  return null;
}

export function subscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const ends =
    subscription.items?.data
      ?.map((item) => item.current_period_end)
      .filter((value): value is number => typeof value === "number") ?? [];
  if (ends.length === 0) return null;
  return new Date(Math.max(...ends) * 1000);
}

async function loadStripeSubscription(subscriptionId: string) {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data"] });
}

export async function upsertProductSubscription(input: {
  userId: string;
  productId: string;
  enrollmentId: string | null;
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}) {
  return prisma.productSubscription.upsert({
    where: { stripeSubscriptionId: input.stripeSubscriptionId },
    create: {
      userId: input.userId,
      productId: input.productId,
      enrollmentId: input.enrollmentId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
      status: input.status,
      currentPeriodEnd: input.currentPeriodEnd,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd,
    },
    update: {
      enrollmentId: input.enrollmentId ?? undefined,
      stripeCustomerId: input.stripeCustomerId ?? undefined,
      status: input.status,
      currentPeriodEnd: input.currentPeriodEnd,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd,
    },
  });
}

async function syncEnrollmentAccess(userId: string, productId: string, active: boolean) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (!enrollment) return null;

  const nextStatus = active ? "ACTIVE" : "EXPIRED";
  if (enrollment.status === nextStatus) return enrollment;

  return prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: nextStatus },
  });
}

export async function handleSubscriptionInvoicePaid(invoice: Stripe.Invoice) {
  if (invoice.status !== "paid") {
    return { ignored: true as const, reason: "not_paid" as const };
  }

  const subscriptionId = subscriptionIdFromInvoice(invoice);
  if (!subscriptionId) {
    return { ignored: true as const, reason: "no_subscription" as const };
  }

  const subscription = await loadStripeSubscription(subscriptionId);
  const catalog = subscription.metadata?.catalog === "demo" ? "demo" : "postgres";
  const buyerId = await resolveLiveUserId(
    subscription.metadata?.buyerId,
    subscription.metadata?.buyerEmail,
  );
  const productId = subscription.metadata?.productId;
  const slug = subscription.metadata?.slug;

  if (!buyerId || !slug) {
    throw new Error("STRIPE_SUBSCRIPTION_MISSING_METADATA");
  }

  const renewal = invoice.billing_reason === "subscription_cycle";

  try {
    if (catalog === "demo") {
      const settled = await demoSettleOrder({ buyerId, slug });
      return { unpaid: false as const, alreadyOwned: false as const, settled };
    }

    if (!productId) {
      throw new Error("STRIPE_SUBSCRIPTION_MISSING_METADATA");
    }

    const settled = await settlePaidOrder({
      buyerId,
      productId,
      provider: "stripe",
      providerRef: invoice.id,
      renewal,
    });

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_productId: { userId: buyerId, productId } },
    });

    await upsertProductSubscription({
      userId: buyerId,
      productId,
      enrollmentId: enrollment?.id ?? null,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId:
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
      status: subscription.status,
      currentPeriodEnd: subscriptionPeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    await syncEnrollmentAccess(
      buyerId,
      productId,
      isSubscriptionAccessActive({
        status: subscription.status,
        currentPeriodEnd: subscriptionPeriodEnd(subscription),
      }),
    );

    return { unpaid: false as const, alreadyOwned: false as const, settled };
  } catch (error) {
    if (error instanceof CommerceError && error.code === "ALREADY_OWNED" && renewal) {
      return { unpaid: false as const, alreadyOwned: true as const, settled: null };
    }
    if (catalog !== "demo" && shouldUseDemoFallback(error)) {
      const settled = await demoSettleOrder({ buyerId, slug });
      return { unpaid: false as const, alreadyOwned: false as const, settled };
    }
    throw error;
  }
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const buyerId = subscription.metadata?.buyerId;
  const productId = subscription.metadata?.productId;
  if (!buyerId || !productId) return { ignored: true as const };

  const currentPeriodEnd = subscriptionPeriodEnd(subscription);

  const existing = await prisma.productSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (existing) {
    await prisma.productSubscription.update({
      where: { id: existing.id },
      data: {
        status: subscription.status,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  await syncEnrollmentAccess(
    buyerId,
    productId,
    isSubscriptionAccessActive({ status: subscription.status, currentPeriodEnd }),
  );

  return { ok: true as const };
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const buyerId = subscription.metadata?.buyerId;
  const productId = subscription.metadata?.productId;
  if (!buyerId || !productId) return { ignored: true as const };

  await prisma.productSubscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status || "canceled",
      currentPeriodEnd: subscriptionPeriodEnd(subscription) ?? new Date(),
      cancelAtPeriodEnd: true,
    },
  });

  await syncEnrollmentAccess(buyerId, productId, false);
  return { ok: true as const };
}

export async function hasActiveProductSubscription(userId: string, productId: string) {
  const row = await prisma.productSubscription.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (!row) return false;
  return isSubscriptionAccessActive({
    status: row.status,
    currentPeriodEnd: row.currentPeriodEnd,
  });
}
