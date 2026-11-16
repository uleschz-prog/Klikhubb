import { isManualPaymentsConfigured } from "@/config/payment-instructions";

export function isSpeiEnabled() {
  return isManualPaymentsConfigured();
}

export type CheckoutMethods = {
  spei: boolean;
};

export function getCheckoutMethods(): CheckoutMethods {
  return {
    spei: isSpeiEnabled(),
  };
}

export type CheckoutIntent = "spei" | "demo";

export function resolveCheckoutIntent(
  method: "spei" | undefined,
  speiOn: boolean,
): CheckoutIntent {
  if (method === "spei") return "spei";
  if (speiOn) return "spei";
  return "demo";
}
