import { COMPENSATION_PLAN_V1, type CreatorPlanRates } from "@/config/compensation-plan";
import { allocateByRates, fromCents, toCents } from "@/lib/money/cents";

export type CommissionLine = {
  beneficiaryId: string;
  sourceUserId: string;
  type: "CREATOR_SALE" | "INVITE" | "PLATFORM_FEE";
  level: number;
  rate: number;
  amountCents: number;
};

function isRealInviter(
  inviterId: string | null | undefined,
  creatorId: string,
  platformUserId?: string | null,
) {
  if (!inviterId) return false;
  if (inviterId === creatorId) return false;
  if (inviterId === "platform" || inviterId === "usr_platform") return false;
  // Qlykadmin es raíz y ya cobra la tarifa de plataforma; no recibe el 5% de invitación.
  if (platformUserId && inviterId === platformUserId) return false;
  return true;
}

/** Creador + plataforma + invitación (o creador absorbe el 5% si nadie invitó). */
export function splitSaleCommissions(input: {
  saleAmount: number;
  creatorId: string;
  inviterId?: string | null;
  /** Usuario raíz (Qlykadmin). Si es el invitador, no se paga el 5%. */
  platformUserId?: string | null;
  plan?: CreatorPlanRates | typeof COMPENSATION_PLAN_V1;
}): CommissionLine[] {
  const plan = input.plan ?? COMPENSATION_PLAN_V1;
  const saleCents = toCents(input.saleAmount);
  const inviterId = isRealInviter(input.inviterId, input.creatorId, input.platformUserId)
    ? input.inviterId
    : null;

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
