import { describe, expect, it } from "vitest";
import { splitSaleCommissions } from "@/lib/commerce/split";
import { COMPENSATION_PLAN_V1 } from "@/config/compensation-plan";
import { fromCents } from "@/lib/money/cents";
import {
  planNowPaymentsSettlement,
  processorFeeUsdFromPayment,
  type NowPaymentsPayment,
} from "@/lib/payments/nowpayments";
import {
  signNowPaymentsPayload,
  sortNowPaymentsPayload,
  verifyNowPaymentsSignature,
} from "@/lib/payments/nowpayments-signature";
import { isValidTrc20Address } from "@/lib/payments/trc20";

const secret = "ipn-secret-test";

describe("NOWPayments IPN HMAC-SHA512", () => {
  it("firma el JSON con claves ordenadas en profundidad y valida la firma", () => {
    const payload = { payment_status: "finished", payment_id: 55, fee: { serviceFee: 1, depositFee: 0 } };
    const signature = signNowPaymentsPayload(payload, secret);
    expect(verifyNowPaymentsSignature({ payload, signature, secret })).toBe(true);
    expect(verifyNowPaymentsSignature({ payload, signature: "00" + signature.slice(2), secret })).toBe(false);
    const sorted = sortNowPaymentsPayload(payload) as Record<string, unknown>;
    expect(Object.keys(sorted)).toEqual(["fee", "payment_id", "payment_status"]);
    expect(Object.keys(sorted.fee as object)).toEqual(["depositFee", "serviceFee"]);
  });
});

describe("NOWPayments asiento e idempotencia de estados", () => {
  const base: NowPaymentsPayment = {
    payment_id: "9001",
    payment_status: "finished",
    price_amount: 100,
    price_currency: "usd",
    outcome_amount: 98.5,
    outcome_currency: "usd",
    actually_paid: 99,
    pay_address: "TEmGwPeRTPiLFLVfBxXkSP91yc5GMNQhfS",
    outcome_hash: "abc123",
  };

  it("sienta solo finished, descuenta la tarifa del bruto y deja pending/fail en otros estados", () => {
    expect(planNowPaymentsSettlement(base).action).toBe("settle");
    expect(planNowPaymentsSettlement(base).processorFeeUsd).toBe(1.5);
    expect(planNowPaymentsSettlement({ ...base, payment_status: "partially_paid" }).action).toBe("pending");
    expect(planNowPaymentsSettlement({ ...base, payment_status: "expired" }).action).toBe("fail");
    expect(planNowPaymentsSettlement({ ...base, payment_status: "failed" }).action).toBe("fail");
    expect(planNowPaymentsSettlement({ ...base, payment_status: "waiting" }).action).toBe("pending");
  });

  it("un segundo finished se planifica igual (la idempotencia real vive en provider+providerRef al asentar)", () => {
    const first = planNowPaymentsSettlement(base);
    const second = planNowPaymentsSettlement(base);
    expect(first).toEqual(second);
    expect(first.action).toBe("settle");
  });

  it("reparte 93/7 sobre el neto tras la tarifa del procesador", () => {
    const fee = processorFeeUsdFromPayment(base);
    const lines = splitSaleCommissions({
      saleAmount: 100,
      creatorId: "creator-1",
      plan: COMPENSATION_PLAN_V1,
      processorFeeAmount: fee,
    });
    const creator = lines.find((line) => line.type === "CREATOR_SALE");
    const platform = lines.find((line) => line.type === "PLATFORM_FEE");
    expect(fee).toBe(1.5);
    expect(fromCents(creator!.amountCents + platform!.amountCents)).toBe(98.5);
  });
});

describe("validación TRC20", () => {
  it("acepta una dirección Tron mainnet real y rechaza basura", () => {
    expect(isValidTrc20Address("TEmGwPeRTPiLFLVfBxXkSP91yc5GMNQhfS")).toBe(true);
    expect(isValidTrc20Address("TEmGwPeRTPiLFLVfBxXkSP91yc5GMNQhfS".toLowerCase())).toBe(false);
    expect(isValidTrc20Address("0x1EBAeF7Bee7B3a7B2EEfC72e86593Bf15ED37522")).toBe(false);
    expect(isValidTrc20Address("TSHORT")).toBe(false);
    expect(isValidTrc20Address("")).toBe(false);
    // checksum roto
    expect(isValidTrc20Address("TEmGwPeRTPiLFLVfBxXkSP91yc5GMNQhfT")).toBe(false);
  });
});
