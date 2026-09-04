import { CREATOR_FLAT_PERIOD_DAYS, CREATOR_FLAT_PRICE_USD, type CreatorPlanCode } from "@/config/compensation-plan";

export {
  COMPENSATION_PLAN_V1,
  CREATOR_FLAT_PERIOD_DAYS,
  CREATOR_FLAT_PRICE_USD,
  CREATOR_PLAN_FLAT,
  CREATOR_PLAN_PAYG,
  ratesForCreatorPlan,
  type CreatorPlanCode,
  type CreatorPlanRates,
} from "@/config/compensation-plan";

/** Plan efectivo para fees de una venta. */
export function resolveEffectiveCreatorPlan(input: {
  preferredPlan: CreatorPlanCode | string | null | undefined;
  planUntil: Date | string | null | undefined;
  now?: Date;
}): CreatorPlanCode {
  const preferred = input.preferredPlan === "FLAT" || input.preferredPlan === "flat" ? "flat" : "payg";
  if (preferred !== "flat") return "payg";
  if (!input.planUntil) return "payg";
  const until = input.planUntil instanceof Date ? input.planUntil : new Date(input.planUntil);
  if (Number.isNaN(until.getTime())) return "payg";
  const now = input.now ?? new Date();
  return until.getTime() > now.getTime() ? "flat" : "payg";
}

export function addFlatPeriod(from: Date = new Date(), days = CREATOR_FLAT_PERIOD_DAYS) {
  return new Date(from.getTime() + days * 86_400_000);
}

export function formatPlanPercent(rate: number) {
  return `${Math.round(rate * 100)}%`;
}
