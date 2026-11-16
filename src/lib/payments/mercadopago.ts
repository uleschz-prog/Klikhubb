import { randomBytes } from "crypto";
import { mxnToUsd, resolveUsdMxnQuote, usdToMxn, type FxQuote } from "@/lib/payments/fx";
import { verifyMercadoPagoSignature } from "@/lib/payments/mp-signature";

const MP_API = "https://api.mercadopago.com";

export class MercadoPagoError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_CONFIGURED"
      | "API_ERROR"
      | "INVALID_SIGNATURE"
      | "BAD_REFERENCE"
      | "FX_UNAVAILABLE",
  ) {
    super(message);
    this.name = "MercadoPagoError";
  }
}

export function getMercadoPagoAccessToken(): string | null {
  return process.env.MP_ACCESS_TOKEN?.trim() || null;
}

export function getMercadoPagoPublicKey(): string | null {
  return process.env.MP_PUBLIC_KEY?.trim() || null;
}

export function getMercadoPagoWebhookSecret(): string | null {
  return process.env.MP_WEBHOOK_SECRET?.trim() || null;
}

export function isMercadoPagoConfigured() {
  return Boolean(getMercadoPagoAccessToken());
}

export function getPublicSiteUrl() {
  const raw =
    process.env.SITE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.trim()}` : "");
  return raw.replace(/\/$/, "") || "http://localhost:3000";
}

export function buildExternalReference(input: {
  buyerId: string;
  productId: string;
  nonce?: string;
}) {
  const nonce = input.nonce ?? randomBytes(6).toString("hex");
  return `qlyk:${input.buyerId}:${input.productId}:${nonce}`;
}

export function parseExternalReference(ref: string | null | undefined): {
  buyerId: string;
  productId: string;
  nonce: string;
} | null {
  if (!ref) return null;
  const parts = ref.trim().split(":");
  if (parts.length !== 4 || parts[0] !== "qlyk") return null;
  const [, buyerId, productId, nonce] = parts;
  if (!buyerId || !productId || !nonce) return null;
  return { buyerId, productId, nonce };
}

export type CreatedPreference = {
  id: string;
  initPoint: string;
  sandboxInitPoint: string | null;
  externalReference: string;
  amountUsd: number;
  amountMxn: number;
  fxRate: number;
  fxAt: Date;
};

export async function createCheckoutPreference(input: {
  buyerId: string;
  productId: string;
  title: string;
  description?: string | null;
  amountUsd: number;
  buyerEmail?: string | null;
  successPath?: string;
  failurePath?: string;
  pendingPath?: string;
  fx?: FxQuote;
}): Promise<CreatedPreference> {
  const token = getMercadoPagoAccessToken();
  if (!token) {
    throw new MercadoPagoError("Mercado Pago no está configurado.", "NOT_CONFIGURED");
  }

  let fx = input.fx;
  try {
    fx = fx ?? (await resolveUsdMxnQuote({ token }));
  } catch {
    throw new MercadoPagoError(
      "No hay tipo de cambio USD→MXN. Define FX_USD_MXN o revisa MP_ACCESS_TOKEN.",
      "FX_UNAVAILABLE",
    );
  }

  const amountMxn = usdToMxn(input.amountUsd, fx.rate);
  if (amountMxn <= 0) {
    throw new MercadoPagoError("El importe en MXN quedó en cero.", "FX_UNAVAILABLE");
  }

  const site = getPublicSiteUrl();
  const externalReference = buildExternalReference({
    buyerId: input.buyerId,
    productId: input.productId,
  });

  const successPath = input.successPath ?? "/checkout/success";
  const failurePath = input.failurePath ?? "/checkout/failure";
  const pendingPath = input.pendingPath ?? "/checkout/pending";

  const body = {
    items: [
      {
        title: input.title.slice(0, 256),
        quantity: 1,
        unit_price: amountMxn,
        currency_id: "MXN",
        description: input.description?.slice(0, 256),
      },
    ],
    external_reference: externalReference,
    metadata: {
      buyer_id: input.buyerId,
      product_id: input.productId,
      platform: "qlyk",
      amount_usd: input.amountUsd,
      amount_mxn: amountMxn,
      fx_rate: fx.rate,
      fx_at: fx.at.toISOString(),
    },
    payer: input.buyerEmail ? { email: input.buyerEmail } : undefined,
    back_urls: {
      success: `${site}${successPath.startsWith("/") ? successPath : `/${successPath}`}`,
      failure: `${site}${failurePath.startsWith("/") ? failurePath : `/${failurePath}`}`,
      pending: `${site}${pendingPath.startsWith("/") ? pendingPath : `/${pendingPath}`}`,
    },
    auto_return: "approved" as const,
    notification_url: `${site}/api/webhooks/mercadopago?source_news=webhooks`,
    statement_descriptor: "QLYK",
  };

  const response = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
    message?: string;
    error?: string;
  } | null;

  if (!response.ok || !payload?.id || !payload.init_point) {
    const detail = payload?.message || payload?.error || `HTTP ${response.status}`;
    console.error("[mercadopago] preference error", detail);
    throw new MercadoPagoError(`No se pudo crear el pago en Mercado Pago: ${detail}`, "API_ERROR");
  }

  const useSandbox = token.startsWith("TEST-") || process.env.MP_USE_SANDBOX === "1";
  const initPoint =
    useSandbox && payload.sandbox_init_point ? payload.sandbox_init_point : payload.init_point;

  return {
    id: payload.id,
    initPoint,
    sandboxInitPoint: payload.sandbox_init_point ?? null,
    externalReference,
    amountUsd: input.amountUsd,
    amountMxn,
    fxRate: fx.rate,
    fxAt: fx.at,
  };
}

export type MercadoPagoPayment = {
  id: number | string;
  status: string;
  status_detail?: string;
  external_reference?: string | null;
  transaction_amount?: number;
  transaction_amount_refunded?: number;
  currency_id?: string;
  fee_details?: Array<{ type?: string; amount?: number }>;
  transaction_details?: { net_received_amount?: number; total_paid_amount?: number };
  metadata?: Record<string, unknown>;
};

export function processorFeeMxnFromPayment(payment: MercadoPagoPayment): number {
  const gross = Number(payment.transaction_amount ?? 0);
  const net = Number(payment.transaction_details?.net_received_amount ?? NaN);
  if (Number.isFinite(net) && gross > 0) {
    return Math.max(0, Number((gross - net).toFixed(2)));
  }
  const fees = (payment.fee_details ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  return Math.max(0, Number(fees.toFixed(2)));
}

export function processorFeeUsdFromPayment(payment: MercadoPagoPayment, fxRate: number): number {
  return mxnToUsd(processorFeeMxnFromPayment(payment), fxRate);
}

export function fxSnapshotFromPayment(
  payment: MercadoPagoPayment,
  fallback?: { amountUsd: number; fxRate: number; fxAt: Date },
): { amountUsd: number; amountMxn: number; fxRate: number; fxAt: Date } | null {
  const meta = payment.metadata ?? {};
  const amountUsd = Number(meta.amount_usd ?? fallback?.amountUsd ?? NaN);
  const amountMxn = Number(meta.amount_mxn ?? payment.transaction_amount ?? NaN);
  const fxRate = Number(meta.fx_rate ?? fallback?.fxRate ?? NaN);
  const fxAtRaw = typeof meta.fx_at === "string" ? meta.fx_at : null;
  const fxAt = fxAtRaw ? new Date(fxAtRaw) : fallback?.fxAt ?? new Date();
  if (!Number.isFinite(amountUsd) || !Number.isFinite(amountMxn) || !Number.isFinite(fxRate) || fxRate <= 0) {
    return fallback
      ? {
          amountUsd: fallback.amountUsd,
          amountMxn: usdToMxn(fallback.amountUsd, fallback.fxRate),
          fxRate: fallback.fxRate,
          fxAt: fallback.fxAt,
        }
      : null;
  }
  return { amountUsd, amountMxn, fxRate, fxAt };
}

export type MercadoPagoSettlementPlan =
  | { action: "ignore"; reason: string; status: string }
  | { action: "replay"; paymentId: string }
  | { action: "settle"; paymentId: string; status: string };

export function planMercadoPagoSettlement(input: {
  status: string;
  paymentId: string;
  alreadySettled: boolean;
}): MercadoPagoSettlementPlan {
  const status = (input.status || "").toLowerCase();
  if (input.alreadySettled) {
    return { action: "replay", paymentId: input.paymentId };
  }
  if (status === "approved") {
    return { action: "settle", paymentId: input.paymentId, status };
  }
  return { action: "ignore", reason: "not_approved", status };
}

export async function fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const token = getMercadoPagoAccessToken();
  if (!token) {
    throw new MercadoPagoError("Mercado Pago no está configurado.", "NOT_CONFIGURED");
  }

  const response = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as MercadoPagoPayment & {
    message?: string;
  };

  if (!response.ok || payload?.id == null) {
    throw new MercadoPagoError(
      payload?.message || `No se pudo obtener el pago ${paymentId}`,
      "API_ERROR",
    );
  }

  return payload;
}

export async function refundMercadoPagoPayment(paymentId: string, orderId: string) {
  const token = getMercadoPagoAccessToken();
  if (!token) {
    throw new MercadoPagoError("Mercado Pago no está configurado.", "NOT_CONFIGURED");
  }

  const response = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `qlyk_refund_${orderId}`,
    },
    body: JSON.stringify({}),
  });

  const payload = (await response.json().catch(() => null)) as {
    id?: number;
    status?: string;
    message?: string;
    error?: string;
  } | null;

  if (!response.ok) {
    const message = payload?.message || payload?.error || `HTTP ${response.status}`;
    if (/already|ya fue|refunded/i.test(message)) return;
    throw new MercadoPagoError(`Mercado Pago no pudo devolver el cargo: ${message}`, "API_ERROR");
  }
}

export function isWebhookSignatureAuthorized(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = getMercadoPagoWebhookSecret();
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[mercadopago] webhook sin MP_WEBHOOK_SECRET — se omite en desarrollo");
      return true;
    }
    return false;
  }
  return verifyMercadoPagoSignature({
    secret,
    xSignature: input.xSignature,
    xRequestId: input.xRequestId,
    dataId: input.dataId,
  });
}

export async function settleFromMercadoPagoPaymentId(paymentId: string) {
  const { settlePaidOrder } = await import("@/lib/commerce/settle-order");
  const { prisma } = await import("@/lib/prisma");

  const payment = await fetchMercadoPagoPayment(paymentId);
  const already = await prisma.payment.findUnique({
    where: { provider_providerRef: { provider: "mercadopago", providerRef: String(payment.id) } },
    select: { orderId: true },
  });

  const plan = planMercadoPagoSettlement({
    status: payment.status,
    paymentId: String(payment.id),
    alreadySettled: Boolean(already),
  });

  if (plan.action === "replay") {
    return { settled: true as const, already: true as const, paymentId: plan.paymentId, orderId: already?.orderId ?? null, status: payment.status };
  }
  if (plan.action === "ignore") {
    return {
      settled: false as const,
      paymentId: String(payment.id),
      status: plan.status,
      statusDetail: payment.status_detail ?? null,
    };
  }

  const fromRef = parseExternalReference(payment.external_reference);
  const metaBuyer = typeof payment.metadata?.buyer_id === "string" ? payment.metadata.buyer_id : null;
  const metaProduct = typeof payment.metadata?.product_id === "string" ? payment.metadata.product_id : null;
  const buyerId = fromRef?.buyerId || metaBuyer;
  const productId = fromRef?.productId || metaProduct;
  if (!buyerId || !productId) {
    throw new MercadoPagoError("El pago no trae external_reference de Qlyk.", "BAD_REFERENCE");
  }

  const fx = fxSnapshotFromPayment(payment);
  const fxRate = fx?.fxRate;
  if (!fx || !fxRate) {
    throw new MercadoPagoError("El pago no trae tipo de cambio USD→MXN.", "FX_UNAVAILABLE");
  }

  const processorFeeAmount = processorFeeUsdFromPayment(payment, fxRate);

  const settled = await settlePaidOrder({
    buyerId,
    productId,
    provider: "mercadopago",
    providerRef: String(payment.id),
    processorFeeAmount,
    amountUsd: fx.amountUsd,
    amountMxn: fx.amountMxn,
    fxRate: fx.fxRate,
    fxAt: fx.fxAt,
  });

  return {
    settled: true as const,
    already: false as const,
    paymentId: String(payment.id),
    status: payment.status,
    orderId: settled.orderId,
  };
}
