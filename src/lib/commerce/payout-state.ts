import { createHash } from "crypto";

export type PayoutLifecycle = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type PayoutTransition = {
  next: PayoutLifecycle;
  reverseBalance: boolean;
  ignore: boolean;
};

/**
 * Referencia externa para /v1/payouts en México: solo dígitos, máx. 50, determinista por payout.
 * @see https://www.mercadopago.com.mx/developers/en/docs/payouts/integration-configuration/money-transfers
 */
export function payoutExternalReference(payoutId: string): string {
  const digest = createHash("sha256").update(`qlyk-payout:${payoutId}`).digest("hex");
  return BigInt(`0x${digest.slice(0, 16)}`).toString().slice(0, 18);
}

export function isValidMpPayoutEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.trim().length <= 254;
}

export function normalizeMpPayoutEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function mapMpTransactionStatus(
  status: string | null | undefined,
  statusDetail?: string | null,
): PayoutLifecycle | "UNKNOWN" {
  const s = (status ?? "").trim().toLowerCase();
  const detail = (statusDetail ?? "").trim().toLowerCase();
  if (s === "success" || s === "completed" || s === "accredited" || detail === "accredited") {
    return "COMPLETED";
  }
  if (s === "error" || s === "failed" || s === "canceled" || s === "cancelled" || s === "rejected") {
    return "FAILED";
  }
  if (s === "pending" || s === "in_process" || s === "inprocess" || s === "created" || s === "scheduled") {
    return "PROCESSING";
  }
  return "UNKNOWN";
}

export function nextPayoutTransition(
  current: PayoutLifecycle,
  incoming: PayoutLifecycle,
): PayoutTransition {
  if (current === incoming) {
    return { next: current, reverseBalance: false, ignore: true };
  }
  if (current === "COMPLETED" || current === "FAILED") {
    return { next: current, reverseBalance: false, ignore: true };
  }
  if (incoming === "PROCESSING") {
    return { next: "PROCESSING", reverseBalance: false, ignore: false };
  }
  if (incoming === "COMPLETED") {
    return { next: "COMPLETED", reverseBalance: false, ignore: false };
  }
  if (incoming === "FAILED") {
    return { next: "FAILED", reverseBalance: true, ignore: false };
  }
  return { next: current, reverseBalance: false, ignore: true };
}

export function extractPayoutIdFromNotification(input: {
  query?: URLSearchParams | Record<string, string | null | undefined>;
  body?: unknown;
}): string | null {
  const queryGet = (key: string): string | null => {
    if (!input.query) return null;
    if (input.query instanceof URLSearchParams) return input.query.get(key);
    const value = input.query[key];
    return value == null ? null : String(value);
  };

  const candidates: Array<string | null | undefined> = [
    queryGet("payout_id"),
    queryGet("id"),
    queryGet("data.id"),
  ];

  const body = input.body;
  if (body && typeof body === "object") {
    const rec = body as Record<string, unknown>;
    const data = rec.data && typeof rec.data === "object" ? (rec.data as Record<string, unknown>) : null;
    candidates.push(
      asString(rec.payout_id),
      asString(rec.payoutId),
      asString(rec.id),
      data ? asString(data.id) : null,
      data ? asString(data.payout_id) : null,
    );
    const resource = asString(rec.resource);
    if (resource) {
      const match = resource.match(/(POP[A-Z0-9]+)/i);
      if (match) candidates.push(match[1]);
    }
    const topic = `${asString(rec.topic) ?? ""} ${asString(rec.type) ?? ""} ${asString(rec.action) ?? ""}`.toLowerCase();
    if (topic.includes("payout") || topic.includes("money_out") || topic.includes("money-out")) {
      candidates.push(asString(rec.id), data ? asString(data.id) : null);
    }
  }

  for (const value of candidates) {
    const id = normalizePayoutId(value);
    if (id) return id;
  }
  return null;
}

export function normalizePayoutId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^POP[A-Z0-9]+$/i.test(trimmed)) return trimmed.toUpperCase();
  // Some notifications wrap the official id; keep a conservative alphanumeric id.
  if (/^[A-Z0-9_-]{8,64}$/i.test(trimmed) && /POP/i.test(trimmed)) {
    const match = trimmed.match(/POP[A-Z0-9]+/i);
    return match ? match[0].toUpperCase() : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : value == null ? null : String(value);
}
