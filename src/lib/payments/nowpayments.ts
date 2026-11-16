import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CommerceError, settlePaidOrder } from "@/lib/commerce/settle-order";
import { buildExternalReference, getPublicSiteUrl, parseExternalReference } from "@/lib/payments/mercadopago";
import { generateTotp } from "@/lib/payments/totp";
import { isValidTrc20Address } from "@/lib/payments/trc20";
import { verifyNowPaymentsSignature } from "@/lib/payments/nowpayments-signature";

const NP_API = "https://api.nowpayments.io/v1";
export const USDT_TRC20 = "usdttrc20";

export class NowPaymentsError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_CONFIGURED" | "API_ERROR" | "INVALID_SIGNATURE" | "BAD_REFERENCE" | "DISABLED",
  ) {
    super(message);
    this.name = "NowPaymentsError";
  }
}

export function isUsdtFlagOn() {
  const raw = process.env.USDT_ENABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function isUsdtPayoutsFlagOn() {
  const raw = process.env.USDT_PAYOUTS_ENABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function getNowPaymentsApiKey() {
  return process.env.NOWPAYMENTS_API_KEY?.trim() || null;
}

export function getNowPaymentsIpnSecret() {
  return process.env.NOWPAYMENTS_IPN_SECRET?.trim() || null;
}

/** El botón USDT solo aparece si el flag está en 1 y hay API key. Por defecto, apagado. */
export function isUsdtEnabled() {
  return isUsdtFlagOn() && Boolean(getNowPaymentsApiKey());
}

export function isUsdtPayoutsReady() {
  return (
    isUsdtEnabled() &&
    isUsdtPayoutsFlagOn() &&
    Boolean(process.env.NOWPAYMENTS_EMAIL?.trim() && process.env.NOWPAYMENTS_PASSWORD)
  );
}

export type NowPaymentsStatus =
  | "waiting"
  | "confirming"
  | "confirmed"
  | "sending"
  | "partially_paid"
  | "finished"
  | "failed"
  | "expired"
  | "refunded"
  | string;

export type NowPaymentsPayment = {
  payment_id: string | number;
  payment_status: NowPaymentsStatus;
  pay_address?: string;
  pay_amount?: number;
  pay_currency?: string;
  price_amount?: number;
  price_currency?: string;
  order_id?: string;
  order_description?: string;
  outcome_amount?: number;
  outcome_currency?: string;
  actually_paid?: number;
  fee?: { currency?: string; depositFee?: number; withdrawalFee?: number; serviceFee?: number } | number;
  payin_extra_id?: string | null;
  purchase_id?: string;
  invoice_id?: string | number | null;
  outcome_hash?: string | null;
  txid?: string | null;
  hash?: string | null;
};

export function planNowPaymentsSettlement(payment: NowPaymentsPayment): {
  action: "settle" | "ignore" | "pending" | "fail";
  status: string;
  processorFeeUsd: number;
  amountUsd: number;
  txHash: string | null;
} {
  const status = String(payment.payment_status ?? "").toLowerCase();
  const amountUsd = Number(payment.price_amount ?? 0);
  const txHash = payment.outcome_hash || payment.txid || payment.hash || null;
  const fee = processorFeeUsdFromPayment(payment);

  if (status === "finished") {
    return { action: "settle", status, processorFeeUsd: fee, amountUsd, txHash };
  }
  if (status === "failed" || status === "expired" || status === "refunded") {
    return { action: "fail", status, processorFeeUsd: fee, amountUsd, txHash };
  }
  if (status === "partially_paid" || status === "waiting" || status === "confirming" || status === "confirmed" || status === "sending") {
    return { action: "pending", status, processorFeeUsd: fee, amountUsd, txHash };
  }
  return { action: "ignore", status, processorFeeUsd: fee, amountUsd, txHash };
}

export function processorFeeUsdFromPayment(payment: NowPaymentsPayment): number {
  const price = Number(payment.price_amount ?? 0);
  const outcome = Number(payment.outcome_amount ?? 0);
  const outcomeCurrency = String(payment.outcome_currency ?? "").toLowerCase();
  if (price > 0 && outcome > 0 && (outcomeCurrency === "usd" || outcomeCurrency === "usdt" || outcomeCurrency === USDT_TRC20)) {
    return Math.max(0, Number((price - outcome).toFixed(4)));
  }
  if (typeof payment.fee === "number" && Number.isFinite(payment.fee)) {
    return Math.max(0, Number(payment.fee.toFixed(4)));
  }
  if (payment.fee && typeof payment.fee === "object") {
    const total =
      Number(payment.fee.depositFee ?? 0) +
      Number(payment.fee.withdrawalFee ?? 0) +
      Number(payment.fee.serviceFee ?? 0);
    if (total > 0) return Number(total.toFixed(4));
  }
  return 0;
}

export type CreatedUsdtInvoice = {
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  priceAmount: number;
  priceCurrency: string;
  status: string;
  invoiceId: string;
};

export async function createUsdtPayment(input: {
  buyerId: string;
  productId: string;
  title: string;
  amountUsd: number;
}): Promise<CreatedUsdtInvoice> {
  if (!isUsdtEnabled()) {
    throw new NowPaymentsError("USDT (TRC20) está desactivado hasta la revisión legal y fiscal.", "DISABLED");
  }
  const apiKey = getNowPaymentsApiKey();
  if (!apiKey) throw new NowPaymentsError("NOWPayments no está configurado.", "NOT_CONFIGURED");

  const site = getPublicSiteUrl();
  const orderId = buildExternalReference({ buyerId: input.buyerId, productId: input.productId });
  const response = await fetch(`${NP_API}/payment`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: input.amountUsd,
      price_currency: "usd",
      pay_currency: USDT_TRC20,
      ipn_callback_url: `${site}/api/webhooks/nowpayments`,
      order_id: orderId,
      order_description: input.title.slice(0, 200),
    }),
  });

  const payload = (await response.json().catch(() => null)) as NowPaymentsPayment & {
    message?: string;
    error?: string;
  } | null;

  const paymentId = payload?.payment_id != null ? String(payload.payment_id) : "";
  if (!response.ok || !paymentId || !payload?.pay_address) {
    const detail = payload?.message || payload?.error || `HTTP ${response.status}`;
    console.error("[nowpayments] create payment", detail);
    throw new NowPaymentsError(`No se pudo crear el cobro USDT: ${detail}`, "API_ERROR");
  }

  const invoice = await prisma.cryptoInvoice.create({
    data: {
      buyerId: input.buyerId,
      productId: input.productId,
      provider: "nowpayments",
      providerRef: paymentId,
      status: "waiting",
      payAddress: payload.pay_address,
      payAmount: payload.pay_amount != null ? new Prisma.Decimal(Number(payload.pay_amount).toFixed(8)) : null,
      payCurrency: payload.pay_currency ?? USDT_TRC20,
      priceAmount: new Prisma.Decimal(Number(input.amountUsd).toFixed(4)),
      priceCurrency: "USD",
      rawStatus: payload.payment_status ?? "waiting",
    },
  });

  return {
    paymentId,
    payAddress: payload.pay_address,
    payAmount: Number(payload.pay_amount ?? 0),
    payCurrency: payload.pay_currency ?? USDT_TRC20,
    priceAmount: input.amountUsd,
    priceCurrency: "USD",
    status: payload.payment_status ?? "waiting",
    invoiceId: invoice.id,
  };
}

export function isNowPaymentsIpnAuthorized(payload: unknown, signature: string | null) {
  return verifyNowPaymentsSignature({
    payload,
    signature,
    secret: getNowPaymentsIpnSecret(),
  });
}

export async function settleFromNowPaymentsPayment(
  payment: NowPaymentsPayment,
): Promise<{ ok: boolean; action: string; orderId?: string }> {
  const plan = planNowPaymentsSettlement(payment);
  const paymentId = String(payment.payment_id);
  const invoice = await prisma.cryptoInvoice.findUnique({ where: { providerRef: paymentId } });
  const parsed = parseExternalReference(payment.order_id);
  const buyerId = invoice?.buyerId ?? parsed?.buyerId;
  const productId = invoice?.productId ?? parsed?.productId;
  if (!buyerId || !productId) {
    throw new NowPaymentsError("La notificación de NOWPayments no trae una referencia válida.", "BAD_REFERENCE");
  }

  await prisma.cryptoInvoice.upsert({
    where: { providerRef: paymentId },
    update: {
      status: plan.status,
      rawStatus: plan.status,
      payAddress: payment.pay_address ?? invoice?.payAddress,
      payAmount:
        payment.pay_amount != null ? new Prisma.Decimal(Number(payment.pay_amount).toFixed(8)) : invoice?.payAmount,
      actuallyPaid:
        payment.actually_paid != null
          ? new Prisma.Decimal(Number(payment.actually_paid).toFixed(8))
          : invoice?.actuallyPaid,
      txHash: plan.txHash ?? invoice?.txHash,
    },
    create: {
      buyerId,
      productId,
      provider: "nowpayments",
      providerRef: paymentId,
      status: plan.status,
      rawStatus: plan.status,
      payAddress: payment.pay_address,
      payAmount: payment.pay_amount != null ? new Prisma.Decimal(Number(payment.pay_amount).toFixed(8)) : null,
      payCurrency: payment.pay_currency ?? USDT_TRC20,
      priceAmount: payment.price_amount != null ? new Prisma.Decimal(Number(payment.price_amount).toFixed(4)) : null,
      priceCurrency: payment.price_currency ?? "USD",
      actuallyPaid:
        payment.actually_paid != null ? new Prisma.Decimal(Number(payment.actually_paid).toFixed(8)) : null,
      txHash: plan.txHash,
    },
  });

  if (plan.action !== "settle") {
    return { ok: true, action: plan.action };
  }

  const settled = await settlePaidOrder({
    buyerId,
    productId,
    provider: "nowpayments",
    providerRef: paymentId,
    processorFeeAmount: plan.processorFeeUsd,
    amountUsd: plan.amountUsd || Number(payment.price_amount ?? 0),
  });

  await prisma.payment.updateMany({
    where: { provider: "nowpayments", providerRef: paymentId },
    data: {
      payAddress: payment.pay_address ?? invoice?.payAddress,
      txHash: plan.txHash,
      payAmount: payment.pay_amount != null ? new Prisma.Decimal(Number(payment.pay_amount).toFixed(8)) : undefined,
      payCurrency: payment.pay_currency ?? USDT_TRC20,
      actuallyPaid:
        payment.actually_paid != null ? new Prisma.Decimal(Number(payment.actually_paid).toFixed(8)) : undefined,
    },
  });

  await prisma.cryptoInvoice.update({
    where: { providerRef: paymentId },
    data: { orderId: settled.orderId, status: "finished" },
  });

  return { ok: true, action: "settle", orderId: settled.orderId };
}

export async function getNowPaymentsPayment(paymentId: string): Promise<NowPaymentsPayment> {
  const apiKey = getNowPaymentsApiKey();
  if (!apiKey) throw new NowPaymentsError("NOWPayments no está configurado.", "NOT_CONFIGURED");
  const response = await fetch(`${NP_API}/payment/${encodeURIComponent(paymentId)}`, {
    headers: { "x-api-key": apiKey },
  });
  const payload = (await response.json().catch(() => null)) as NowPaymentsPayment & {
    message?: string;
  } | null;
  if (!response.ok || !payload?.payment_id) {
    throw new NowPaymentsError(payload?.message || `HTTP ${response.status}`, "API_ERROR");
  }
  return payload;
}

async function nowPaymentsJwt(): Promise<string> {
  const email = process.env.NOWPAYMENTS_EMAIL?.trim();
  const password = process.env.NOWPAYMENTS_PASSWORD;
  if (!email || !password) {
    throw new NowPaymentsError("Faltan NOWPAYMENTS_EMAIL y NOWPAYMENTS_PASSWORD para retiros USDT.", "NOT_CONFIGURED");
  }
  const response = await fetch(`${NP_API}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = (await response.json().catch(() => null)) as { token?: string; message?: string } | null;
  if (!response.ok || !payload?.token) {
    throw new NowPaymentsError(payload?.message || "No se pudo autenticar en NOWPayments.", "API_ERROR");
  }
  return payload.token;
}

export async function createUsdtPayout(input: {
  address: string;
  amountUsd: number;
  ipnCallbackUrl?: string;
}): Promise<{ batchId: string; withdrawalId: string | null; status: string; verified: boolean }> {
  if (!isUsdtPayoutsReady()) {
    throw new NowPaymentsError("Los retiros USDT automáticos no están habilitados.", "DISABLED");
  }
  if (!isValidTrc20Address(input.address)) {
    throw new NowPaymentsError("La dirección TRC20 no es válida.", "BAD_REFERENCE");
  }
  const apiKey = getNowPaymentsApiKey();
  if (!apiKey) throw new NowPaymentsError("NOWPayments no está configurado.", "NOT_CONFIGURED");

  const token = await nowPaymentsJwt();
  const site = getPublicSiteUrl();
  const response = await fetch(`${NP_API}/payout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ipn_callback_url: input.ipnCallbackUrl ?? `${site}/api/webhooks/nowpayments`,
      withdrawals: [
        {
          address: input.address,
          currency: USDT_TRC20,
          amount: Number(input.amountUsd.toFixed(6)),
          fiat_amount: Number(input.amountUsd.toFixed(2)),
          fiat_currency: "usd",
        },
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as {
    id?: string | number;
    withdrawals?: Array<{ id?: string | number; status?: string }>;
    message?: string;
  } | null;

  const batchId = payload?.id != null ? String(payload.id) : "";
  if (!response.ok || !batchId) {
    throw new NowPaymentsError(payload?.message || `HTTP ${response.status}`, "API_ERROR");
  }

  let verified = false;
  const twoFactorSecret = process.env.NOWPAYMENTS_2FA_SECRET?.trim();
  if (twoFactorSecret) {
    const verifyRes = await fetch(`${NP_API}/payout/${encodeURIComponent(batchId)}/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ verification_code: generateTotp(twoFactorSecret) }),
    });
    verified = verifyRes.ok;
  }

  return {
    batchId,
    withdrawalId: payload?.withdrawals?.[0]?.id != null ? String(payload.withdrawals[0].id) : null,
    status: payload?.withdrawals?.[0]?.status ?? "CREATING",
    verified,
  };
}

export function isNowPaymentsPayoutPayload(body: unknown): body is { id?: string; batch_withdrawal_id?: string; status?: string; hash?: string; address?: string } {
  if (!body || typeof body !== "object") return false;
  const rec = body as Record<string, unknown>;
  return Boolean(rec.batch_withdrawal_id || (rec.currency && rec.address && rec.status && !rec.payment_id && !rec.price_amount));
}

export { CommerceError };
