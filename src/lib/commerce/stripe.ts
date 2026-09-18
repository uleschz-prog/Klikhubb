import Stripe from "stripe";
import { siteUrl } from "@/config/site";
import { toCents } from "@/lib/money/cents";
import { resolveLiveUserId } from "@/lib/auth/resolve-user";
import { CommerceError, settlePaidOrder, type SettledOrder } from "@/lib/commerce/settle-order";
import { demoEnrollmentOrderId, demoSettleOrder, shouldUseDemoFallback } from "@/lib/demo/store";
import { isLivePaymentsRequired } from "@/config/payment-instructions";
import type { ResolvedProduct } from "@/lib/commerce/catalog";
import { prisma } from "@/lib/prisma";

export { isStripeEnabled } from "@/config/checkout-methods";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  return new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
}

export function appBaseUrl() {
  return siteUrl();
}

function unixToDate(value: unknown): Date | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return new Date(value * 1000);
  }
  return null;
}

export function stripeSubscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const record = sub as Stripe.Subscription & {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  return unixToDate(record.current_period_end) ?? unixToDate(record.items?.data?.[0]?.current_period_end);
}

export function stripeInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const record = invoice as Stripe.Invoice & {
    subscription?: string | { id: string } | null;
    parent?: { subscription_details?: { subscription?: string | { id: string } | null } };
  };
  if (typeof record.subscription === "string") return record.subscription;
  if (record.subscription && typeof record.subscription === "object" && "id" in record.subscription) {
    return record.subscription.id;
  }
  const nested = record.parent?.subscription_details?.subscription;
  if (typeof nested === "string") return nested;
  if (nested && typeof nested === "object" && "id" in nested) return nested.id;
  return null;
}

export async function createStripeCheckoutSession(input: {
  buyerId: string;
  buyerEmail?: string | null;
  product: ResolvedProduct;
  cancelPath?: string;
}) {
  const stripe = getStripe();
  const origin = appBaseUrl();
  const currency = input.product.currency.trim().toLowerCase() || "usd";
  const cancelPath = input.cancelPath?.startsWith("/") ? input.cancelPath : `/feed`;
  const monthly = input.product.billing === "MONTHLY";
  const metadata = {
    buyerId: input.buyerId,
    buyerEmail: input.buyerEmail ?? "",
    productId: input.product.id,
    slug: input.product.slug,
    catalog: input.product.source,
  };
  const productData = {
    name: input.product.title,
    metadata: { slug: input.product.slug },
  };

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: monthly ? "subscription" : "payment",
    locale: "es",
    customer_email: input.buyerEmail ?? undefined,
    client_reference_id: input.buyerId,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&slug=${encodeURIComponent(input.product.slug)}`,
    cancel_url: `${origin}${cancelPath}${cancelPath.includes("?") ? "&" : "?"}canceled=1`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toCents(input.product.price),
          product_data: productData,
          ...(monthly ? { recurring: { interval: "month" as const } } : {}),
        },
      },
    ],
    metadata,
  };

  if (monthly) {
    params.subscription_data = { metadata };
  } else {
    params.payment_intent_data = {
      description: `Qlyk · ${input.product.title}`,
      metadata: {
        buyerId: input.buyerId,
        productId: input.product.id,
        slug: input.product.slug,
      },
    };
  }

  return stripe.checkout.sessions.create(params);
}

export type FulfillResult = {
  unpaid: boolean;
  alreadyOwned: boolean;
  settled: SettledOrder | null;
  productSlug: string | null;
};

function sessionPaid(session: Stripe.Checkout.Session) {
  if (session.payment_status === "paid" || session.payment_status === "no_payment_required") return true;
  return session.status === "complete" && session.mode === "subscription";
}

function idFromExpandable(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof (value as { id: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  return null;
}

/** Idempotente: webhook y /checkout/success pueden llamarlo los dos. */
export async function fulfillCheckoutSession(sessionId: string): Promise<FulfillResult> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const slug = session.metadata?.slug || null;

  if (!sessionPaid(session)) {
    return { unpaid: true, alreadyOwned: false, settled: null, productSlug: slug };
  }

  const buyerId = await resolveLiveUserId(
    session.metadata?.buyerId,
    session.metadata?.buyerEmail || session.customer_email,
  );
  const productId = session.metadata?.productId;
  const catalog = session.metadata?.catalog === "demo" ? "demo" : "postgres";
  const subscriptionId = idFromExpandable(session.subscription);
  const customerId = idFromExpandable(session.customer);

  let periodEnd: Date | null = null;
  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      periodEnd = stripeSubscriptionPeriodEnd(sub);
    } catch (error) {
      console.error("stripe subscription retrieve", error);
    }
  }

  if (!buyerId || !slug) {
    throw new Error("STRIPE_SESSION_MISSING_METADATA");
  }

  try {
    if (catalog === "demo") {
      if (isLivePaymentsRequired()) {
        throw new Error("STRIPE_DEMO_SETTLE_FORBIDDEN");
      }
      const settled = await demoSettleOrder({ buyerId, slug });
      return { unpaid: false, alreadyOwned: false, settled, productSlug: slug };
    }
    if (!productId) {
      throw new Error("STRIPE_SESSION_MISSING_METADATA");
    }
    const settled = await settlePaidOrder({
      buyerId,
      productId,
      provider: "stripe",
      providerRef: session.id,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      periodEnd,
    });
    return { unpaid: false, alreadyOwned: false, settled, productSlug: settled.productSlug ?? slug };
  } catch (error) {
    if (error instanceof CommerceError && error.code === "ALREADY_OWNED") {
      return { unpaid: false, alreadyOwned: true, settled: null, productSlug: slug };
    }
    const code = error instanceof Error ? error.message : "";
    if (code === "ALREADY_OWNED") {
      const orderId = productId ? await demoEnrollmentOrderId(buyerId, productId) : null;
      return {
        unpaid: false,
        alreadyOwned: true,
        settled: orderId
          ? { orderId, productTitle: slug, productSlug: slug, total: 0, currency: "USD", lines: [] }
          : null,
        productSlug: slug,
      };
    }
    if (catalog !== "demo" && shouldUseDemoFallback(error)) {
      const settled = await demoSettleOrder({ buyerId, slug });
      return { unpaid: false, alreadyOwned: false, settled, productSlug: slug };
    }
    throw error;
  }
}

export async function fulfillStripeInvoice(invoice: Stripe.Invoice) {
  const billingReason = (invoice as Stripe.Invoice & { billing_reason?: string | null }).billing_reason;
  if (billingReason !== "subscription_cycle") {
    return { skipped: billingReason ?? "not_cycle" };
  }

  const stripe = getStripe();
  const subscriptionId = stripeInvoiceSubscriptionId(invoice);
  if (!subscriptionId) {
    return { skipped: "no_subscription" };
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const buyerId = await resolveLiveUserId(
    subscription.metadata?.buyerId,
    invoice.customer_email ?? subscription.metadata?.buyerEmail,
  );
  const productId = subscription.metadata?.productId;
  if (!buyerId || !productId) {
    return { skipped: "missing_metadata" };
  }

  const settled = await settlePaidOrder({
    buyerId,
    productId,
    provider: "stripe",
    providerRef: invoice.id,
    renewal: true,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: idFromExpandable(invoice.customer) ?? idFromExpandable(subscription.customer),
    periodEnd: stripeSubscriptionPeriodEnd(subscription),
  });
  return { settled };
}

export async function expireStripeSubscription(subscription: Stripe.Subscription) {
  const existing = await prisma.productSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { id: true, userId: true, productId: true },
  });
  const productId = subscription.metadata?.productId ?? existing?.productId;
  const buyerId =
    (await resolveLiveUserId(subscription.metadata?.buyerId, subscription.metadata?.buyerEmail)) ?? existing?.userId;
  if (!productId || !buyerId) return;

  await prisma.$transaction([
    prisma.productSubscription.updateMany({
      where: {
        OR: [{ stripeSubscriptionId: subscription.id }, { userId: buyerId, productId }],
      },
      data: { status: "canceled", cancelAtPeriodEnd: false },
    }),
    prisma.enrollment.updateMany({
      where: { userId: buyerId, productId, status: "ACTIVE" },
      data: { status: "EXPIRED" },
    }),
  ]);
}
