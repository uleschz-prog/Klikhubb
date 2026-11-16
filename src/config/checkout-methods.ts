import { isManualPaymentsConfigured } from "@/config/payment-instructions";
import { isMercadoPagoConfigured } from "@/lib/payments/mercadopago";

export function isSpeiEnabled() {
  return isManualPaymentsConfigured();
}

export function isMercadoPagoEnabled() {
  return isMercadoPagoConfigured();
}

export type CheckoutMethods = {
  mercadopago: boolean;
  spei: boolean;
};

export function getCheckoutMethods(): CheckoutMethods {
  return {
    mercadopago: isMercadoPagoEnabled(),
    spei: isSpeiEnabled(),
  };
}

export type CheckoutIntent = "mercadopago" | "spei" | "demo";

export function resolveCheckoutIntent(
  method: "mercadopago" | "spei" | undefined,
  methods: CheckoutMethods,
): CheckoutIntent {
  if (method === "mercadopago") return "mercadopago";
  if (method === "spei") return "spei";
  if (methods.mercadopago) return "mercadopago";
  if (methods.spei) return "spei";
  return "demo";
}
