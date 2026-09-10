import {
  isLivePaymentsRequired,
  isManualPaymentsConfigured,
  preferredLiveCheckoutMode,
} from "@/config/payment-instructions";
import { isMercadoPagoConfigured } from "@/lib/payments/mercadopago";

export type CheckoutPaymentFlags = {
  /** Hay cobro real en este entorno (prod) y al menos un método configurado. */
  liveCheckoutEnabled: boolean;
  mercadoPagoEnabled: boolean;
  /** SPEI solo si no hay Mercado Pago (respaldo). */
  manualPaymentsEnabled: boolean;
};

/** Flags de UI/checkout para páginas server. */
export function getCheckoutPaymentFlags(): CheckoutPaymentFlags {
  const live = isLivePaymentsRequired();
  if (!live) {
    return {
      liveCheckoutEnabled: false,
      mercadoPagoEnabled: false,
      manualPaymentsEnabled: false,
    };
  }

  const mp = isMercadoPagoConfigured();
  const manual = isManualPaymentsConfigured();
  const preferred = preferredLiveCheckoutMode();

  return {
    liveCheckoutEnabled: mp || manual,
    mercadoPagoEnabled: preferred === "mercadopago",
    manualPaymentsEnabled: preferred === "manual",
  };
}
