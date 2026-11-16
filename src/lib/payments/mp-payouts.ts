import { randomUUID } from "crypto";
import { getMercadoPagoAccessToken, getPublicSiteUrl, MercadoPagoError } from "@/lib/payments/mercadopago";
import { normalizePem, signPayoutBody } from "@/lib/payments/mp-payout-sign";

const MP_API = "https://api.mercadopago.com";

export type MercadoPagoPayoutCreated = {
  id: string;
  status: string;
  externalReference: string;
  transactionId: string | null;
  rawStatus: string;
};

export type MercadoPagoPayoutTransaction = {
  id: string;
  status: string;
  statusDetail: string | null;
  amount: number | null;
  currency: string | null;
};

export type MercadoPagoPayoutStatus = {
  id: string;
  status: string;
  externalReference: string | null;
  transactions: MercadoPagoPayoutTransaction[];
};

export function isMercadoPagoPayoutsFlagOn() {
  const raw = process.env.MP_PAYOUTS_ENABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function isMercadoPagoPayoutsSandbox() {
  const token = getMercadoPagoAccessToken() ?? "";
  return token.startsWith("TEST-") || process.env.MP_USE_SANDBOX === "1";
}

export function getMercadoPagoPayoutsPrivateKey(): string | null {
  return normalizePem(process.env.MP_PAYOUTS_PRIVATE_KEY);
}

export function isMercadoPagoPayoutsConfigured() {
  return Boolean(getMercadoPagoAccessToken()) && isMercadoPagoPayoutsFlagOn();
}

/** Listo para disparar la API: flag + token, y clave Ed25519 si es producción. */
export function isMercadoPagoPayoutsReady() {
  if (!isMercadoPagoPayoutsConfigured()) return false;
  if (isMercadoPagoPayoutsSandbox()) return true;
  return Boolean(getMercadoPagoPayoutsPrivateKey());
}

export function newPayoutIdempotencyKey() {
  return randomUUID();
}

export async function createAccountPayout(input: {
  email: string;
  amountMxn: number;
  externalReference: string;
  idempotencyKey: string;
  description?: string;
}): Promise<MercadoPagoPayoutCreated> {
  const token = getMercadoPagoAccessToken();
  if (!token) {
    throw new MercadoPagoError("Mercado Pago no está configurado.", "NOT_CONFIGURED");
  }
  if (input.amountMxn <= 0) {
    throw new MercadoPagoError("El importe en MXN quedó en cero.", "FX_UNAVAILABLE");
  }

  const site = getPublicSiteUrl();
  const payload = {
    external_reference: input.externalReference,
    config: {
      notification_url: `${site}/api/webhooks/mercadopago`,
    },
    description: input.description ?? "Retiro Qlyk creador",
    transactions: [
      {
        type: "account",
        description: "Retiro Qlyk",
        account: { email: input.email },
        amount: { currency: "MXN", value: input.amountMxn },
        external_reference: input.externalReference,
      },
    ],
  };

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Idempotency-Key": input.idempotencyKey,
  };

  const sandbox = isMercadoPagoPayoutsSandbox();
  const privateKey = getMercadoPagoPayoutsPrivateKey();

  if (sandbox) {
    headers["X-test-token"] = "true";
    if (privateKey) {
      headers["X-enforce-signature"] = "true";
      headers["X-signature"] = signPayoutBody(privateKey, body);
    } else {
      headers["X-enforce-signature"] = "false";
    }
  } else {
    if (!privateKey) {
      throw new MercadoPagoError(
        "En producción los retiros MP exigen MP_PAYOUTS_PRIVATE_KEY (Ed25519). El retiro queda para marca manual.",
        "NOT_CONFIGURED",
      );
    }
    headers["X-enforce-signature"] = "true";
    headers["X-signature"] = signPayoutBody(privateKey, body);
  }

  const response = await fetch(`${MP_API}/v1/payouts`, {
    method: "POST",
    headers,
    body,
  });

  const json = (await response.json().catch(() => null)) as {
    id?: string;
    status?: string;
    external_reference?: string;
    transactions?: Array<{ id?: string }>;
    message?: string;
    error?: string;
  } | null;

  if (!response.ok || !json?.id) {
    const detail = json?.message || json?.error || `HTTP ${response.status}`;
    console.error("[mercadopago] payout create error", detail);
    throw new MercadoPagoError(`No se pudo enviar el retiro a Mercado Pago: ${detail}`, "API_ERROR");
  }

  return {
    id: json.id,
    status: json.status ?? "created",
    externalReference: json.external_reference ?? input.externalReference,
    transactionId: json.transactions?.[0]?.id ?? null,
    rawStatus: json.status ?? "created",
  };
}

export async function getAccountPayout(payoutId: string): Promise<MercadoPagoPayoutStatus> {
  const token = getMercadoPagoAccessToken();
  if (!token) {
    throw new MercadoPagoError("Mercado Pago no está configurado.", "NOT_CONFIGURED");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (isMercadoPagoPayoutsSandbox()) headers["X-test-token"] = "true";

  const [batchRes, txRes] = await Promise.all([
    fetch(`${MP_API}/v1/payouts/${encodeURIComponent(payoutId)}`, { headers }),
    fetch(`${MP_API}/v1/payouts/${encodeURIComponent(payoutId)}/transactions?limit=100&offset=0`, { headers }),
  ]);

  const batch = (await batchRes.json().catch(() => null)) as {
    id?: string;
    status?: string;
    external_reference?: string;
    message?: string;
    error?: string;
  } | null;

  if (!batchRes.ok || !batch?.id) {
    const detail = batch?.message || batch?.error || `HTTP ${batchRes.status}`;
    throw new MercadoPagoError(`No se pudo consultar el retiro en Mercado Pago: ${detail}`, "API_ERROR");
  }

  const txPayload = (await txRes.json().catch(() => null)) as {
    transactions?: Array<{
      id?: string;
      status?: string;
      status_detail?: string;
      amount?: { currency?: string; value?: number };
    }>;
  } | null;

  const transactions: MercadoPagoPayoutTransaction[] = (txPayload?.transactions ?? []).map((row) => ({
    id: String(row.id ?? ""),
    status: row.status ?? "",
    statusDetail: row.status_detail ?? null,
    amount: typeof row.amount?.value === "number" ? row.amount.value : null,
    currency: row.amount?.currency ?? null,
  }));

  return {
    id: batch.id,
    status: batch.status ?? "",
    externalReference: batch.external_reference ?? null,
    transactions,
  };
}
