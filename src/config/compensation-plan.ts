/**
 * Planes de monetización del creador.
 *
 * PAYG  — pagas solo cuando vendes: plataforma 7%, invitación 5%, creador 88%.
 * FLAT  — $25 USD / mes: plataforma 0% mientras el periodo esté activo;
 *         la invitación 5% se mantiene; el creador recibe el resto.
 *
 * Se puede cambiar de modalidad en cualquier momento. El fee de cada venta
 * se calcula con el plan efectivo en el momento del asentamiento.
 */
export const CREATOR_FLAT_PRICE_USD = 25;
export const CREATOR_FLAT_PERIOD_DAYS = 30;

export const CREATOR_PLAN_PAYG = {
  code: "payg" as const,
  label: "Pago cuando vendo",
  shortLabel: "7% por venta",
  platformFeeRate: 0.07,
  creatorRate: 0.88,
  inviteRate: 0.05,
  description:
    "Sin cuota mensual. En cada venta Qlyk se queda el 7% de servicio y el 5% va a quien te invitó (si aplica).",
};

export const CREATOR_PLAN_FLAT = {
  code: "flat" as const,
  label: "Plan mensual",
  shortLabel: "$25 / mes",
  monthlyPriceUsd: CREATOR_FLAT_PRICE_USD,
  periodDays: CREATOR_FLAT_PERIOD_DAYS,
  platformFeeRate: 0,
  creatorRate: 0.95,
  inviteRate: 0.05,
  description:
    "Cuota fija de $25 USD al mes. Mientras esté activo, Qlyk no cobra comisión por venta (solo el 5% de invitación si aplica).",
};

export type CreatorPlanCode = typeof CREATOR_PLAN_PAYG.code | typeof CREATOR_PLAN_FLAT.code;

export type CreatorPlanRates = {
  code: CreatorPlanCode;
  platformFeeRate: number;
  creatorRate: number;
  inviteRate: number;
  holdDays: number;
};

/** Compat: plan por defecto = PAYG (antes era 85/10/5 fijo). */
export const COMPENSATION_PLAN_V1 = {
  code: "klikhubb-v2-payg",
  platformFeeRate: CREATOR_PLAN_PAYG.platformFeeRate,
  creatorRate: CREATOR_PLAN_PAYG.creatorRate,
  inviteRate: CREATOR_PLAN_PAYG.inviteRate,
  holdDays: 14,
} as const;

export function ratesForCreatorPlan(plan: CreatorPlanCode): CreatorPlanRates {
  if (plan === "flat") {
    return {
      code: "flat",
      platformFeeRate: CREATOR_PLAN_FLAT.platformFeeRate,
      creatorRate: CREATOR_PLAN_FLAT.creatorRate,
      inviteRate: CREATOR_PLAN_FLAT.inviteRate,
      holdDays: COMPENSATION_PLAN_V1.holdDays,
    };
  }
  return {
    code: "payg",
    platformFeeRate: CREATOR_PLAN_PAYG.platformFeeRate,
    creatorRate: CREATOR_PLAN_PAYG.creatorRate,
    inviteRate: CREATOR_PLAN_PAYG.inviteRate,
    holdDays: COMPENSATION_PLAN_V1.holdDays,
  };
}

export const PLATFORM_PROTECTED_PATHS = ["/dashboard", "/checkout", "/wallet"] as const;
