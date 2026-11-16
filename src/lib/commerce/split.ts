import { COMPENSATION_PLAN_V1, type CreatorPlanRates } from "@/config/compensation-plan";
import { allocateByRates, fromCents, toCents } from "@/lib/money/cents";

export type CommissionLine = {
  beneficiaryId: string;
  sourceUserId: string;
  type: "CREATOR_SALE" | "PLATFORM_FEE" | "UNILEVEL";
  level: number;
  rate: number;
  amountCents: number;
};

/** Importe neto sobre el que se aplica el 93/7 (o 100% FLAT), ya descontada la tarifa del procesador. */
export function netSaleCentsAfterProcessorFee(saleAmount: number, processorFeeAmount = 0): number {
  const saleCents = toCents(saleAmount);
  const feeCents = Math.max(0, toCents(processorFeeAmount));
  return Math.max(0, saleCents - feeCents);
}

/** Creador + plataforma. Sin comisión de referidos. La tarifa del procesador se descuenta del bruto antes del reparto. */
export function splitSaleCommissions(input: {
  saleAmount: number;
  creatorId: string;
  plan?: CreatorPlanRates | typeof COMPENSATION_PLAN_V1;
  /** Comisión del procesador de pagos (bruto), en la misma unidad que saleAmount. */
  processorFeeAmount?: number;
}): CommissionLine[] {
  const plan = input.plan ?? COMPENSATION_PLAN_V1;
  const netCents = netSaleCentsAfterProcessorFee(input.saleAmount, input.processorFeeAmount ?? 0);
  const [creatorCents, platformCents] = allocateByRates(netCents, [
    plan.creatorRate,
    plan.platformFeeRate,
  ]);
  return [
    {
      beneficiaryId: input.creatorId,
      sourceUserId: input.creatorId,
      type: "CREATOR_SALE",
      level: 0,
      rate: plan.creatorRate,
      amountCents: creatorCents,
    },
    {
      beneficiaryId: "platform",
      sourceUserId: input.creatorId,
      type: "PLATFORM_FEE",
      level: 0,
      rate: plan.platformFeeRate,
      amountCents: platformCents,
    },
  ];
}

export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(fromCents(toCents(amount)));
}
