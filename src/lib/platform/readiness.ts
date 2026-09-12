import { legalIdentityComplete, legalMeta } from "@/config/legal";
import { getPaymentInstructions, isManualPaymentsConfigured } from "@/config/payment-instructions";
import { isStripeEnabled } from "@/config/checkout-methods";

export type SetupCheck = {
  id: string;
  label: string;
  ok: boolean;
  hint: string;
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
  const manualPayments = isManualPaymentsConfigured();
  const paymentInstructions = getPaymentInstructions();
  const stripeKey = isStripeEnabled();
  const stripeWebhook = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  const stripeReady = stripeKey && stripeWebhook;
  const paymentsReady = stripeReady || manualPayments;
  const adminPassword = Boolean(process.env.PLATFORM_ADMIN_PASSWORD?.trim());
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const legal = getLegalSetupStatus();
  const isProduction = process.env.VERCEL_ENV === "production";

  const checks: SetupCheck[] = [
    {
      id: "admin_password",
      label: "PLATFORM_ADMIN_PASSWORD",
      ok: !isProduction || adminPassword,
      hint: isProduction
        ? "Obligatoria en producción para el login de Qlykadmin"
        : "Opcional en local (hay fallback de desarrollo)",
    },
    {
      id: "stripe",
      label: "Stripe (tarjeta)",
      ok: stripeReady,
      hint: stripeReady
        ? "Checkout Session + webhook configurados"
        : stripeKey
          ? "Falta STRIPE_WEBHOOK_SECRET (endpoint /api/webhooks/stripe)"
          : "Opcional si SPEI está activo. Define STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET",
    },
    {
      id: "payment_bank",
      label: "SPEI (transferencia)",
      ok: manualPayments,
      hint: manualPayments
        ? `${paymentInstructions?.bankName} · CLABE configurada`
        : "Opcional si Stripe está activo. Define PAYMENT_BANK_NAME, PAYMENT_BENEFICIARY y PAYMENT_CLABE",
    },
    {
      id: "payments_any",
      label: "Al menos un método de cobro",
      ok: paymentsReady,
      hint: paymentsReady
        ? [stripeReady ? "Stripe" : null, manualPayments ? "SPEI" : null].filter(Boolean).join(" + ")
        : "Activa Stripe (clave + webhook) o los datos SPEI",
    },
    {
      id: "blob",
      label: "BLOB_READ_WRITE_TOKEN",
      ok: blob || (stripeReady && !manualPayments),
      hint: blob
        ? "Subida de archivos activa"
        : manualPayments
          ? "Necesario para que los compradores adjunten comprobantes SPEI"
          : "Recomendado para avatares y media; obligatorio si usas SPEI",
    },
    {
      id: "legal_entity",
      label: "Identidad legal pública",
      ok: legal.complete,
      hint: legal.complete
        ? "Términos y privacidad muestran razón social y domicilio"
        : `Faltan: ${legal.missing.join(", ") || "LEGAL_*"}`,
    },
  ];

  const blockers = checks.filter((check) => {
    if (check.id === "stripe" || check.id === "payment_bank") return false;
    return !check.ok;
  });

  return {
    checks,
    legal,
    payments: {
      stripeEnabled: stripeReady,
      manualEnabled: manualPayments,
      instructions: paymentInstructions,
    },
    environment: process.env.VERCEL_ENV ?? "development",
    readyForBeta: blockers.length === 0,
    allChecksPass: blockers.length === 0,
  };
}
