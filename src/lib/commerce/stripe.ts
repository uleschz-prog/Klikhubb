import Stripe from "stripe";
import { siteUrl } from "@/config/site";
import { toCents } from "@/lib/money/cents";
import { CommerceError, settlePaidOrder, type SettledOrder } from "@/lib/commerce/settle-order";
import { demoEnrollmentOrderId, demoSettleOrder, isConnectionError } from "@/lib/demo/store";
import type { ResolvedProduct } from "@/lib/commerce/catalog";

export function isStripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function appBaseUrl() {
  return siteUrl();
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  return new Stripe(key);
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

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.buyerEmail ?? undefined,
    client_reference_id: input.buyerId,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${cancelPath}${cancelPath.includes("?") ? "&" : "?"}canceled=1`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toCents(input.product.price),
          product_data: {
            name: input.product.title,
            metadata: { slug: input.product.slug },
          },
        },
      },
    ],
    metadata: {
      buyerId: input.buyerId,
      productId: input.product.id,
      slug: input.product.slug,
      catalog: input.product.source,
    },
  });
}

export type FulfillResult = {
  unpaid: boolean;
  alreadyOwned: boolean;
  settled: SettledOrder | null;
};

/**
 * Idempotente: webhook y /checkout/success pueden llamarlo los dos.
 * Solo asienta si Stripe confirma payment_status = paid.
 */
export async function fulfillCheckoutSession(sessionId: string): Promise<FulfillResult> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return { unpaid: true, alreadyOwned: false, settled: null };
  }

  const buyerId = session.metadata?.buyerId;
  const productId = session.metadata?.productId;
  const slug = session.metadata?.slug;
  const catalog = session.metadata?.catalog === "demo" ? "demo" : "postgres";

  if (!buyerId || !slug) {
    throw new Error("STRIPE_SESSION_MISSING_METADATA");
  }

  try {
    if (catalog === "demo") {
      const settled = await demoSettleOrder({ buyerId, slug });
      return { unpaid: false, alreadyOwned: false, settled };
    }
    if (!productId) {
      throw new Error("STRIPE_SESSION_MISSING_METADATA");
    }
    const settled = await settlePaidOrder({
      buyerId,
      productId,
      provider: "stripe",
      providerRef: session.id,
    });
    return { unpaid: false, alreadyOwned: false, settled };
  } catch (error) {
    if (error instanceof CommerceError && error.code === "ALREADY_OWNED") {
      return { unpaid: false, alreadyOwned: true, settled: null };
    }
    const code = error instanceof Error ? error.message : "";
    if (code === "ALREADY_OWNED") {
      const orderId = productId ? await demoEnrollmentOrderId(buyerId, productId) : null;
      return {
        unpaid: false,
        alreadyOwned: true,
        settled: orderId
          ? { orderId, productTitle: slug, total: 0, currency: "USD", lines: [] }
          : null,
      };
    }
    if (catalog !== "demo" && isConnectionError(error)) {
      const settled = await demoSettleOrder({ buyerId, slug });
      return { unpaid: false, alreadyOwned: false, settled };
    }
    throw error;
  }
}
