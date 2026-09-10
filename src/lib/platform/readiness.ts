import { legalIdentityComplete, legalMeta } from "@/config/legal";
import {
  getPaymentInstructions,
  isManualPaymentsConfigured,
} from "@/config/payment-instructions";
import { isMercadoPagoConfigured } from "@/lib/payments/mercadopago";

export type SetupCheck = {
  id: string;
  label: string;
  ok: boolean;
  hint: string;
  /** Si false, no bloquea readyForBeta (informativo). */
  required?: boolean;
};

export function getLegalSetupStatus() {
  const missing: string[] = [];
  if (legalMeta.legalEntity === "Titular de la plataforma Qlyk") missing.push("LEGAL_ENTITY_NAME");
  if (!legalMeta.taxId) missing.push("LEGAL_TAX_ID");
  if (!legalMeta.address) missing.push("LEGAL_ADDRESS");

  return {
    complete: legalIdentityComplete(),
    missing,
    fields: {
      entity: legalMeta.legalEntity !== "Titular de la plataforma Qlyk",
      taxId: Boolean(legalMeta.taxId),
      address: Boolean(legalMeta.address),
      contactEmail: Boolean(legalMeta.contactEmail),
      privacyEmail: Boolean(legalMeta.privacyEmail),
    },
  };
}

export function getPlatformReadiness() {
  const mercadoPago = isMercadoPagoConfigured();
  const manualPayments = isManualPaymentsConfigured();
  const paymentInstructions = getPaymentInstructions();
  const paymentsOk = mercadoPago || manualPayments;
  const adminPassword = Boolean(process.env.PLATFORM_ADMIN_PASSWORD?.trim());
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const legal = getLegalSetupStatus();
  const isProduction = process.env.VERCEL_ENV === "production";

  const checks: SetupCheck[] = [
    {
      id: "admin_password",
      label: "PLATFORM_ADMIN_PASSWORD",
      ok: !isProduction || adminPassword,
      required: true,
      hint: isProduction
        ? "Obligatoria en producción para el login de Qlykadmin"
        : "Opcional en local (hay fallback de desarrollo)",
    },
    {
      id: "mercadopago",
      label: "Mercado Pago (Checkout Pro)",
      ok: mercadoPago,
      required: !manualPayments,
      hint: mercadoPago
        ? "MP_ACCESS_TOKEN configurado — método principal de cobro"
        : manualPayments
          ? "Recomendado: define MP_ACCESS_TOKEN para cobro automático (hoy usas SPEI)"
          : "Define MP_ACCESS_TOKEN (y opcional MP_PUBLIC_KEY, MP_WEBHOOK_SECRET) en Vercel",
    },
    {
      id: "payment_bank",
      label: "SPEI manual (respaldo)",
      ok: manualPayments,
      required: !mercadoPago,
      hint: manualPayments
        ? `${paymentInstructions?.bankName} · CLABE configurada`
        : mercadoPago
          ? "Opcional con Mercado Pago activo"
          : "Define PAYMENT_BANK_NAME, PAYMENT_BENEFICIARY y PAYMENT_CLABE, o usa Mercado Pago",
    },
    {
      id: "blob",
      label: "BLOB_READ_WRITE_TOKEN",
      ok: blob,
      required: !mercadoPago && manualPayments,
      hint: blob
        ? "Subida de comprobantes activa (SPEI)"
        : mercadoPago
          ? "Opcional con Mercado Pago (solo para SPEI)"
          : "Necesario para comprobantes SPEI",
    },
    {
      id: "legal_entity",
      label: "Identidad legal pública",
      ok: legal.complete,
      required: true,
      hint: legal.complete
        ? "Términos y privacidad muestran razón social y domicilio"
        : `Faltan: ${legal.missing.join(", ") || "LEGAL_*"}`,
    },
  ];

  const blockers = checks.filter((check) => (check.required ?? true) && !check.ok);

  return {
    checks,
    legal,
    payments: {
      mercadoPagoEnabled: mercadoPago,
      manualEnabled: manualPayments,
      preferred: mercadoPago ? ("mercadopago" as const) : manualPayments ? ("manual" as const) : null,
      instructions: paymentInstructions,
    },
    environment: process.env.VERCEL_ENV ?? "development",
    readyForBeta: paymentsOk && blockers.length === 0,
    allChecksPass: paymentsOk && blockers.length === 0,
  };
}
