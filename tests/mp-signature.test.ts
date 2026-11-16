import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  extractPaymentIdFromWebhook,
  signatureDataId,
  verifyMercadoPagoSignature,
} from "@/lib/payments/mp-signature";

function sign(secret: string, dataId: string, requestId: string, ts: string) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

describe("verifyMercadoPagoSignature", () => {
  const secret = "whsec_test_123";
  const dataId = "1234567890";
  const requestId = "req-abc";
  const ts = "1700000000";

  it("acepta una firma HMAC válida", () => {
    expect(
      verifyMercadoPagoSignature({
        secret,
        xSignature: sign(secret, dataId, requestId, ts),
        xRequestId: requestId,
        dataId,
      }),
    ).toBe(true);
  });

  it("rechaza un v1 alterado", () => {
    expect(
      verifyMercadoPagoSignature({
        secret,
        xSignature: `ts=${ts},v1=${"0".repeat(64)}`,
        xRequestId: requestId,
        dataId,
      }),
    ).toBe(false);
  });

  it("rechaza si falta el header", () => {
    expect(
      verifyMercadoPagoSignature({
        secret,
        xSignature: null,
        xRequestId: requestId,
        dataId,
      }),
    ).toBe(false);
  });
});

describe("extractPaymentIdFromWebhook", () => {
  it("toma data.id de la query", () => {
    const query = new URLSearchParams("type=payment&data.id=999");
    expect(extractPaymentIdFromWebhook({ query, body: null })).toBe("999");
    expect(signatureDataId({ query, paymentId: "999" })).toBe("999");
  });

  it("toma data.id del cuerpo JSON", () => {
    const query = new URLSearchParams();
    expect(
      extractPaymentIdFromWebhook({
        query,
        body: { type: "payment", data: { id: 42 } },
      }),
    ).toBe("42");
  });
});
