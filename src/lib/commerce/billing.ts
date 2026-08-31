import type { ProductBilling } from "@prisma/client";
import { formatMoney } from "@/lib/commerce/split";

export type BillingMode = ProductBilling;

export function isMonthlyBilling(billing: BillingMode | string | null | undefined) {
  return billing === "MONTHLY";
}

export function billingLabel(billing: BillingMode | string | null | undefined) {
  return isMonthlyBilling(billing) ? "Suscripción mensual" : "Pago único";
}

export function formatProductPrice(
  price: number,
  currency = "USD",
  billing: BillingMode | string | null | undefined = "ONE_TIME",
) {
  const base = formatMoney(price, currency);
  return isMonthlyBilling(billing) ? `${base}/mes` : base;
}

export function checkoutButtonLabel(
  billing: BillingMode | string | null | undefined,
  stripeEnabled: boolean,
  title: string,
) {
  if (stripeEnabled) {
    return isMonthlyBilling(billing) ? "Suscribirme con tarjeta" : "Pagar con tarjeta";
  }
  return isMonthlyBilling(billing) ? `Suscribirme a ${title}` : `Pagar ${title}`;
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

export function isSubscriptionAccessActive(input: {
  status: string;
  currentPeriodEnd: Date | null;
}) {
  if (!ACTIVE_SUBSCRIPTION_STATUSES.has(input.status)) return false;
  if (input.currentPeriodEnd && input.currentPeriodEnd.getTime() <= Date.now()) return false;
  return true;
}
