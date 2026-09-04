import { COMPENSATION_PLAN_V1, type CreatorPlanRates } from "@/config/compensation-plan";
import { allocateByRates, fromCents, toCents } from "@/lib/money/cents";

export type CommissionLine = {
  beneficiaryId: string;
  sourceUserId: string;
  type: "CREATOR_SALE" | "PLATFORM_FEE";
  level: number;
  rate: number;
  amountCents: number;
};

/** Creador + plataforma. Sin comisión de referidos. */
export function splitSaleCommissions(input: {
  saleAmount: number;
  creatorId: string;
  plan?: CreatorPlanRates | typeof COMPENSATION_PLAN_V1;
}): CommissionLine[] {
  const plan = input.plan ?? COMPENSATION_PLAN_V1;
  const saleCents = toCents(input.saleAmount);
  const [creatorCents, platformCents] = allocateByRates(saleCents, [
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
