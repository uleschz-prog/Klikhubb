import { createHmac, timingSafeEqual } from "crypto";

export function sortNowPaymentsPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sortNowPaymentsPayload(item));
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    return Object.keys(rec)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortNowPaymentsPayload(rec[key]);
        return acc;
      }, {});
  }
  return value;
}

export function signNowPaymentsPayload(payload: unknown, secret: string): string {
  const hmac = createHmac("sha512", secret);
  hmac.update(JSON.stringify(sortNowPaymentsPayload(payload)));
  return hmac.digest("hex");
}

export function verifyNowPaymentsSignature(input: {
  payload: unknown;
  signature: string | null | undefined;
  secret: string | null | undefined;
}): boolean {
  if (!input.secret || !input.signature) return false;
  const expected = signNowPaymentsPayload(input.payload, input.secret);
  const received = input.signature.trim().toLowerCase();
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
