import { createHmac, timingSafeEqual } from "crypto";

/**
 * Valida la firma x-signature de un webhook de Mercado Pago.
 * Manifest: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * Ver https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
 */
export function parseMercadoPagoSignature(xSignature: string | null): { ts: string; v1: string } | null {
  if (!xSignature?.trim()) return null;
  const parts = Object.fromEntries(
    xSignature.split(",").map((chunk) => {
      const [key, ...rest] = chunk.trim().split("=");
      return [key?.trim(), rest.join("=").trim()];
    }),
  ) as Record<string, string>;
  if (!parts.ts || !parts.v1) return null;
  return { ts: parts.ts, v1: parts.v1 };
}

export function buildMercadoPagoSignatureManifest(input: {
  dataId: string;
  requestId: string;
  ts: string;
}) {
  return `id:${input.dataId};request-id:${input.requestId};ts:${input.ts};`;
}

export function verifyMercadoPagoSignature(input: {
  secret: string;
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = input.secret.trim();
  if (!secret || !input.xSignature || !input.xRequestId || !input.dataId) return false;
  const parsed = parseMercadoPagoSignature(input.xSignature);
  if (!parsed) return false;

  const manifest = buildMercadoPagoSignatureManifest({
    dataId: input.dataId,
    requestId: input.xRequestId,
    ts: parsed.ts,
  });
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(parsed.v1, "utf8");
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
  const queryDataId = input.query.get("data.id");
  const qId = queryDataId || input.query.get("id");
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

/** data.id que debe entrar al manifest: el de la query si viene, si no el id del pago. */
export function signatureDataId(input: { query: URLSearchParams; paymentId: string | null }) {
  return input.query.get("data.id") || input.paymentId;
}
