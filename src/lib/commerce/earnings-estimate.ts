import {
  CREATOR_FLAT_PRICE_USD,
  CREATOR_PLAN_FLAT,
  CREATOR_PLAN_PAYG,
  flatBreakEvenMonthlySalesUsd,
} from "@/config/compensation-plan";
import { convertUsdToMxn } from "@/lib/commerce/display-fx";

export type EstimateCurrency = "USD" | "MXN";

export const ESTIMATE_PRICE_RANGE = {
  USD: { min: 5, max: 300, step: 1, defaultValue: 49 },
  MXN: { min: 99, max: 5999, step: 1, defaultValue: 999 },
} as const;

export const ESTIMATE_SALES_RANGE = { min: 0, max: 120, step: 1, defaultValue: 12 } as const;

export function priceToUsd(amount: number, currency: EstimateCurrency, fx: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (currency === "MXN") {
    if (!Number.isFinite(fx) || fx <= 0) return 0;
    return Math.round((amount / fx) * 100) / 100;
  }
  return Math.round(amount * 100) / 100;
}

export function priceFromUsd(amountUsd: number, currency: EstimateCurrency, fx: number): number {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return 0;
  if (currency === "MXN") return convertUsdToMxn(amountUsd, fx);
  return Math.round(amountUsd * 100) / 100;
}

export function clampEstimatePrice(amount: number, currency: EstimateCurrency): number {
  const range = ESTIMATE_PRICE_RANGE[currency];
  if (!Number.isFinite(amount)) return range.defaultValue;
  return Math.min(range.max, Math.max(range.min, Math.round(amount)));
}

export function estimateMonthlyCreatorShare(input: {
  priceAmount: number;
  currency: EstimateCurrency;
  salesPerMonth: number;
  fx: number;
}) {
  const sales = Number.isFinite(input.salesPerMonth)
    ? Math.min(ESTIMATE_SALES_RANGE.max, Math.max(ESTIMATE_SALES_RANGE.min, Math.round(input.salesPerMonth)))
    : 0;
  const priceUsd = priceToUsd(input.priceAmount, input.currency, input.fx);
  const grossUsd = Math.round(priceUsd * sales * 100) / 100;
  const paygUsd = Math.round(grossUsd * CREATOR_PLAN_PAYG.creatorRate * 100) / 100;
  const flatUsd = Math.round((grossUsd * CREATOR_PLAN_FLAT.creatorRate - CREATOR_FLAT_PRICE_USD) * 100) / 100;
  const delta = flatUsd - paygUsd;
  const better: "payg" | "flat" | "tie" = Math.abs(delta) < 0.005 ? "tie" : delta > 0 ? "flat" : "payg";

  const toDisplay = (usd: number) => (input.currency === "MXN" ? convertUsdToMxn(usd, input.fx) : usd);

  return {
    currency: input.currency,
    fx: input.fx,
    sales,
    priceUsd,
    grossUsd,
    paygUsd,
    flatUsd,
    gross: toDisplay(grossUsd),
    payg: toDisplay(paygUsd),
    flat: toDisplay(flatUsd),
    flatFee: toDisplay(CREATOR_FLAT_PRICE_USD),
    better,
    breakEvenUsd: flatBreakEvenMonthlySalesUsd(),
    exactBreakEvenUsd: CREATOR_FLAT_PRICE_USD / (CREATOR_PLAN_FLAT.creatorRate - CREATOR_PLAN_PAYG.creatorRate),
    paygRate: CREATOR_PLAN_PAYG.creatorRate,
    flatRate: CREATOR_PLAN_FLAT.creatorRate,
  };
}
