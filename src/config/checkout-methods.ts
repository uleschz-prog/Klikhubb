import { isManualPaymentsConfigured } from "@/config/payment-instructions";
import { isMercadoPagoConfigured } from "@/lib/payments/mercadopago";
import { isUsdtEnabled } from "@/lib/payments/nowpayments";

export function isSpeiEnabled() {
  return isManualPaymentsConfigured();
}

export function isMercadoPagoEnabled() {
  return isMercadoPagoConfigured();
}

export type CheckoutMethods = {
  mercadopago: boolean;
  spei: boolean;
  usdt: boolean;
};

export function getCheckoutMethods(): CheckoutMethods {
  return {
    mercadopago: isMercadoPagoEnabled(),
    spei: isSpeiEnabled(),
    usdt: isUsdtEnabled(),
  };
}

export type CheckoutIntent = "mercadopago" | "spei" | "usdt" | "demo";

export function resolveCheckoutIntent(
  method: "mercadopago" | "spei" | "usdt" | undefined,
  methods: CheckoutMethods,
): CheckoutIntent {
  if (method === "mercadopago") return "mercadopago";
  if (method === "spei") return "spei";
  if (method === "usdt") return "usdt";
  if (methods.mercadopago) return "mercadopago";
  if (methods.spei) return "spei";
  if (methods.usdt) return "usdt";
  return "demo";
}
