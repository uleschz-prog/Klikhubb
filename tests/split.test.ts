import { describe, expect, it } from "vitest";
import { netSaleCentsAfterProcessorFee, splitSaleCommissions } from "@/lib/commerce/split";
import { COMPENSATION_PLAN_V1 } from "@/config/compensation-plan";
import { fromCents } from "@/lib/money/cents";

const PAYG = COMPENSATION_PLAN_V1;
const FLAT = {
  code: "flat" as const,
  creatorRate: 1,
  platformFeeRate: 0,
  holdDays: 1,
  holdHours: 24,
};

describe("netSaleCentsAfterProcessorFee", () => {
  it("no descuenta nada si la tarifa es 0", () => {
    expect(netSaleCentsAfterProcessorFee(100, 0)).toBe(10_000);
  });

  it("resta la tarifa del procesador del bruto", () => {
    expect(netSaleCentsAfterProcessorFee(100, 4)).toBe(9_600);
  });

  it("no deja el neto en negativo", () => {
    expect(netSaleCentsAfterProcessorFee(10, 40)).toBe(0);
  });
});

describe("splitSaleCommissions", () => {
  it("reparte 93/7 sobre el bruto cuando no hay tarifa de procesador", () => {
    const lines = splitSaleCommissions({ saleAmount: 100, creatorId: "creator-1", plan: PAYG });
    const creator = lines.find((line) => line.type === "CREATOR_SALE");
    const platform = lines.find((line) => line.type === "PLATFORM_FEE");
    expect(creator?.amountCents).toBe(9_300);
    expect(platform?.amountCents).toBe(700);
    expect(fromCents(creator!.amountCents + platform!.amountCents)).toBe(100);
  });

  it("descuenta la tarifa del procesador ANTES del 93/7", () => {
    const lines = splitSaleCommissions({
      saleAmount: 100,
      creatorId: "creator-1",
      plan: PAYG,
      processorFeeAmount: 4,
    });
    const creator = lines.find((line) => line.type === "CREATOR_SALE");
    const platform = lines.find((line) => line.type === "PLATFORM_FEE");
    // Neto 96 → 93% = 89.28, 7% = 6.72
    expect(creator?.amountCents).toBe(8_928);
    expect(platform?.amountCents).toBe(672);
    expect(creator!.amountCents + platform!.amountCents).toBe(9_600);
  });

  it("en plan FLAT el 100% del neto va al creador", () => {
    const lines = splitSaleCommissions({
      saleAmount: 100,
      creatorId: "creator-1",
      plan: FLAT,
      processorFeeAmount: 4,
    });
    const creator = lines.find((line) => line.type === "CREATOR_SALE");
    const platform = lines.find((line) => line.type === "PLATFORM_FEE");
    expect(creator?.amountCents).toBe(9_600);
    expect(platform?.amountCents).toBe(0);
  });
});
