import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const MP_API = "https://api.mercadopago.com";

export class MercadoPagoError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_CONFIGURED" | "API_ERROR" | "INVALID_SIGNATURE" | "BAD_REFERENCE",
  ) {
    super(message);
    this.name = "MercadoPagoError";
  }
}

export function getMercadoPagoAccessToken(): string | null {
  return process.env.MP_ACCESS_TOKEN?.trim() || process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || null;
}

export function getMercadoPagoPublicKey(): string | null {
  return process.env.MP_PUBLIC_KEY?.trim() || process.env.MERCADOPAGO_PUBLIC_KEY?.trim() || null;
}

export function getMercadoPagoWebhookSecret(): string | null {
  return (
    process.env.MP_WEBHOOK_SECRET?.trim() ||
    process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() ||
    null
  );
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

/** Referencia opaca que viaja en Preference.external_reference y vuelve en el pago. */
export function buildExternalReference(input: {
  buyerId: string;
  productId: string;
  nonce?: string;
}) {
  const nonce = input.nonce ?? cryptoRandom();
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

function cryptoRandom() {
  return randomBytes(6).toString("hex");
}

type PreferenceItem = {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
  description?: string;
};

export type CreatedPreference = {
  id: string;
  initPoint: string;
  sandboxInitPoint: string | null;
  externalReference: string;
};

export async function createCheckoutPreference(input: {
  buyerId: string;
  productId: string;
  title: string;
  description?: string | null;
  amount: number;
  currency: string;
  buyerEmail?: string | null;
  successPath?: string;
  failurePath?: string;
  pendingPath?: string;
}): Promise<CreatedPreference> {
  const token = getMercadoPagoAccessToken();
  if (!token) {
    throw new MercadoPagoError("Mercado Pago no está configurado.", "NOT_CONFIGURED");
  }

  const site = getPublicSiteUrl();
  const externalReference = buildExternalReference({
    buyerId: input.buyerId,
    productId: input.productId,
  });

  const currencyId = (input.currency || "USD").trim().toUpperCase().slice(0, 3);
  const item: PreferenceItem = {
    title: input.title.slice(0, 256),
    quantity: 1,
    unit_price: Number(Number(input.amount).toFixed(2)),
    currency_id: currencyId,
  };
  if (input.description) {
    item.description = input.description.slice(0, 256);
  }

  const successPath = input.successPath ?? "/checkout/success";
  const failurePath = input.failurePath ?? "/checkout/failure";
  const pendingPath = input.pendingPath ?? "/checkout/pending";

  const body = {
    items: [item],
    external_reference: externalReference,
    metadata: {
      buyer_id: input.buyerId,
      product_id: input.productId,
      platform: "qlyk",
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
    console.error("[mercadopago] preference error", detail, payload);
    throw new MercadoPagoError(`No se pudo crear el pago en Mercado Pago: ${detail}`, "API_ERROR");
  }

  const useSandbox =
    process.env.MP_USE_SANDBOX === "1" ||
    process.env.MP_USE_SANDBOX === "true" ||
    token.startsWith("TEST-");

  const initPoint =
    useSandbox && payload.sandbox_init_point ? payload.sandbox_init_point : payload.init_point;

  return {
    id: payload.id,
    initPoint,
    sandboxInitPoint: payload.sandbox_init_point ?? null,
    externalReference,
  };
}

export type MercadoPagoPayment = {
  id: number | string;
  status: string;
  status_detail?: string;
  external_reference?: string | null;
  transaction_amount?: number;
  currency_id?: string;
  metadata?: Record<string, unknown>;
};

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

/**
 * Valida x-signature de webhooks MP cuando hay secret configurado.
 * Si no hay secret, no falla (útil en sandbox temprano) pero loguea aviso.
 */
export function verifyMercadoPagoWebhookSignature(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = getMercadoPagoWebhookSecret();
  if (!secret) {
    console.warn("[mercadopago] webhook sin MP_WEBHOOK_SECRET — se omite validación de firma");
    return true;
  }

  if (!input.xSignature || !input.xRequestId || !input.dataId) {
    return false;
  }

  const parts = Object.fromEntries(
    input.xSignature.split(",").map((chunk) => {
      const [k, ...rest] = chunk.trim().split("=");
      return [k?.trim(), rest.join("=").trim()];
    }),
  ) as Record<string, string>;

  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  const manifest = `id:${input.dataId};request-id:${input.xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(hash, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function extractPaymentIdFromWebhook(input: {
  query: URLSearchParams;
  body: unknown;
}): string | null {
  const qId = input.query.get("data.id") || input.query.get("id");
  const qTopic = input.query.get("type") || input.query.get("topic");

  if (qId && (!qTopic || qTopic === "payment" || qTopic === "payments")) {
    return qId;
  }

  const body = input.body as {
    type?: string;
    action?: string;
    data?: { id?: string | number };
    id?: string | number;
  } | null;

  if (body?.data?.id != null) {
    const type = body.type || body.action || "";
    if (!type || type.includes("payment")) {
      return String(body.data.id);
    }
  }

  if (body?.id != null && (body.type === "payment" || !body.type)) {
    return String(body.id);
  }

  return qId;
}

export type SettleFromMpResult =
  | {
      settled: false;
      paymentId: string;
      status: string;
      statusDetail: string | null;
    }
  | {
      settled: true;
      paymentId: string;
      status: string;
      orderId: string;
    };

/**
 * Si el pago MP está approved, asienta la venta (idempotente por providerRef = payment.id).
 */
export async function settleFromMercadoPagoPaymentId(
  paymentId: string,
): Promise<SettleFromMpResult> {
  const { settlePaidOrder } = await import("@/lib/commerce/settle-order");
  const payment = await fetchMercadoPagoPayment(paymentId);
  const status = (payment.status || "").toLowerCase();

  if (status !== "approved") {
    return {
      settled: false,
      paymentId: String(payment.id),
      status,
      statusDetail: payment.status_detail ?? null,
    };
  }

  const fromRef = parseExternalReference(payment.external_reference);
  const metaBuyer =
    typeof payment.metadata?.buyer_id === "string" ? payment.metadata.buyer_id : null;
  const metaProduct =
    typeof payment.metadata?.product_id === "string" ? payment.metadata.product_id : null;

  const buyerId = fromRef?.buyerId || metaBuyer;
  const productId = fromRef?.productId || metaProduct;

  if (!buyerId || !productId) {
    throw new MercadoPagoError(
      "El pago no trae external_reference de Qlyk.",
      "BAD_REFERENCE",
    );
  }

  const settled = await settlePaidOrder({
    buyerId,
    productId,
    provider: "mercadopago",
    providerRef: String(payment.id),
  });

  return {
    settled: true,
    paymentId: String(payment.id),
    status,
    orderId: settled.orderId,
  };
}
