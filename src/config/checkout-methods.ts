import { isManualPaymentsConfigured } from "@/config/payment-instructions";

export function isStripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function isSpeiEnabled() {
  return isManualPaymentsConfigured();
}

export type CheckoutMethods = {
  stripe: boolean;
  spei: boolean;
};

export function getCheckoutMethods(): CheckoutMethods {
  return {
    stripe: isStripeEnabled(),
    spei: isSpeiEnabled(),
  };
}

export type CheckoutIntent = "stripe" | "spei" | "choose" | "demo";

export function resolveCheckoutIntent(
  method: "stripe" | "spei" | undefined,
  stripeOn: boolean,
  speiOn: boolean,
): CheckoutIntent {
  if (method === "stripe") return "stripe";
  if (method === "spei") return "spei";
  if (stripeOn && !speiOn) return "stripe";
  if (speiOn && !stripeOn) return "spei";
  if (stripeOn && speiOn) return "choose";
  return "demo";
}
