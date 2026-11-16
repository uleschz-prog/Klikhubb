import { describe, expect, it } from "vitest";
import {
  planMercadoPagoSettlement,
  processorFeeMxnFromPayment,
  processorFeeUsdFromPayment,
} from "@/lib/payments/mercadopago";
import { splitSaleCommissions } from "@/lib/commerce/split";
import { COMPENSATION_PLAN_V1 } from "@/config/compensation-plan";

describe("planMercadoPagoSettlement", () => {
  it("asienta un pago approved nuevo", () => {
    expect(
      planMercadoPagoSettlement({ status: "approved", paymentId: "1", alreadySettled: false }),
    ).toEqual({ action: "settle", paymentId: "1", status: "approved" });
  });

  it("es idempotente si el pago ya se asentó", () => {
    expect(
      planMercadoPagoSettlement({ status: "approved", paymentId: "1", alreadySettled: true }),
    ).toEqual({ action: "replay", paymentId: "1" });
  });

  it("ignora pagos pending o rejected", () => {
    expect(
      planMercadoPagoSettlement({ status: "pending", paymentId: "1", alreadySettled: false }).action,
    ).toBe("ignore");
    expect(
      planMercadoPagoSettlement({ status: "rejected", paymentId: "1", alreadySettled: false }).action,
    ).toBe("ignore");
  });
});

describe("fee + split from MP payment", () => {
  it("obtiene la comisión del procesador y la descuenta antes del 93/7", () => {
    const payment = {
      id: 1,
      status: "approved",
      transaction_amount: 1850,
      transaction_details: { net_received_amount: 1760 },
    };
    const feeMxn = processorFeeMxnFromPayment(payment);
    expect(feeMxn).toBe(90);
    const fxRate = 18.5;
    const feeUsd = processorFeeUsdFromPayment(payment, fxRate);
    expect(feeUsd).toBeCloseTo(90 / 18.5, 4);

    const lines = splitSaleCommissions({
      saleAmount: 100,
      creatorId: "c1",
      plan: COMPENSATION_PLAN_V1,
      processorFeeAmount: feeUsd,
    });
    const net = 100 - feeUsd;
    const creator = lines.find((line) => line.type === "CREATOR_SALE")!;
    const platform = lines.find((line) => line.type === "PLATFORM_FEE")!;
    expect((creator.amountCents + platform.amountCents) / 100).toBeCloseTo(net, 2);
  });
});
