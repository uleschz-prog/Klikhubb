import { BUYER_REFUND_WINDOW_HOURS } from "@/config/refund-policy";

/**
 * Planes de monetización del creador.
 *
 * PAYG  — pagas solo cuando vendes: plataforma 7%, creador 93%.
 * FLAT  — $25 USD / mes: plataforma 0% mientras el periodo esté activo;
 *         el creador recibe el 100%.
 *
 * No hay sistema de referidos ni comisión de invitación.
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
  creatorRate: 0.93,
  description:
    "Sin cuota mensual. En cada venta Qlyk se queda el 7% de servicio y tú te quedas el 93%.",
};

export const CREATOR_PLAN_FLAT = {
  code: "flat" as const,
  label: "Plan mensual",
  shortLabel: "$25 / mes",
  monthlyPriceUsd: CREATOR_FLAT_PRICE_USD,
  periodDays: CREATOR_FLAT_PERIOD_DAYS,
  platformFeeRate: 0,
  creatorRate: 1,
  description:
    "Cuota fija de $25 USD al mes. Mientras esté activo, Qlyk no cobra comisión por venta: te quedas el 100%.",
};

export type CreatorPlanCode = typeof CREATOR_PLAN_PAYG.code | typeof CREATOR_PLAN_FLAT.code;

export type CreatorPlanRates = {
  code: CreatorPlanCode;
  platformFeeRate: number;
  creatorRate: number;
  holdDays: number;
  holdHours: number;
};

/** El hold de retiro coincide con la ventana de reembolso del comprador. */
export const CREATOR_HOLD_HOURS = BUYER_REFUND_WINDOW_HOURS;

export function creatorHoldMs() {
  return CREATOR_HOLD_HOURS * 60 * 60 * 1000;
}

export function creatorHoldLabel() {
  if (CREATOR_HOLD_HOURS === 24) return "24 horas";
  if (CREATOR_HOLD_HOURS % 24 === 0) {
    const days = CREATOR_HOLD_HOURS / 24;
    return days === 1 ? "1 día" : `${days} días`;
  }
  return `${CREATOR_HOLD_HOURS} horas`;
}

/** Compat: plan por defecto = PAYG. */
export const COMPENSATION_PLAN_V1 = {
  code: "klikhubb-v3-payg",
  platformFeeRate: CREATOR_PLAN_PAYG.platformFeeRate,
  creatorRate: CREATOR_PLAN_PAYG.creatorRate,
  holdDays: CREATOR_HOLD_HOURS / 24,
  holdHours: CREATOR_HOLD_HOURS,
} as const;

export function ratesForCreatorPlan(plan: CreatorPlanCode): CreatorPlanRates {
  if (plan === "flat") {
    return {
      code: "flat",
      platformFeeRate: CREATOR_PLAN_FLAT.platformFeeRate,
      creatorRate: CREATOR_PLAN_FLAT.creatorRate,
      holdDays: COMPENSATION_PLAN_V1.holdDays,
      holdHours: COMPENSATION_PLAN_V1.holdHours,
    };
  }
  return {
    code: "payg",
    platformFeeRate: CREATOR_PLAN_PAYG.platformFeeRate,
    creatorRate: CREATOR_PLAN_PAYG.creatorRate,
    holdDays: COMPENSATION_PLAN_V1.holdDays,
    holdHours: COMPENSATION_PLAN_V1.holdHours,
  };
}

export const PLATFORM_PROTECTED_PATHS = ["/dashboard", "/checkout", "/wallet"] as const;
