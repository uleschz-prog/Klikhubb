import { COMPENSATION_PLAN_V1 } from "@/config/compensation-plan";
import { allocateByRates, fromCents, toCents } from "@/lib/money/cents";

export type CommissionLine = {
  beneficiaryId: string;
  sourceUserId: string;
  type: "CREATOR_SALE" | "INVITE" | "PLATFORM_FEE";
  level: number;
  rate: number;
  amountCents: number;
};

function isRealInviter(inviterId: string | null | undefined, creatorId: string) {
  if (!inviterId) return false;
  if (inviterId === creatorId) return false;
  if (inviterId === "platform" || inviterId === "usr_platform") return false;
  return true;
}

/** 80% creador · 10% plataforma · 10% a quien invitó (o al creador si nadie lo hizo). */
export function splitSaleCommissions(input: {
  saleAmount: number;
  creatorId: string;
  inviterId?: string | null;
  plan?: typeof COMPENSATION_PLAN_V1;
}): CommissionLine[] {
  const plan = input.plan ?? COMPENSATION_PLAN_V1;
  const saleCents = toCents(input.saleAmount);
  const inviterId = isRealInviter(input.inviterId, input.creatorId) ? input.inviterId : null;

  if (inviterId) {
    const [creatorCents, inviteCents, platformCents] = allocateByRates(saleCents, [
      plan.creatorRate,
      plan.inviteRate,
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
        beneficiaryId: inviterId,
        sourceUserId: input.creatorId,
        type: "INVITE",
        level: 1,
        rate: plan.inviteRate,
        amountCents: inviteCents,
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

  const creatorRate = plan.creatorRate + plan.inviteRate;
  const [creatorCents, platformCents] = allocateByRates(saleCents, [creatorRate, plan.platformFeeRate]);
  return [
    {
      beneficiaryId: input.creatorId,
      sourceUserId: input.creatorId,
      type: "CREATOR_SALE",
      level: 0,
      rate: creatorRate,
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
