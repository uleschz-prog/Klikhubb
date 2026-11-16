import { legalIdentityComplete, legalMeta } from "@/config/legal";
import { getPaymentInstructions, isManualPaymentsConfigured } from "@/config/payment-instructions";

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
  const paymentsReady = manualPayments;
  const adminPassword = Boolean(process.env.PLATFORM_ADMIN_PASSWORD?.trim());
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const cronSecret = Boolean(process.env.CRON_SECRET?.trim());
  const legal = getLegalSetupStatus();
  const isProduction = process.env.VERCEL_ENV === "production";

  const checks: SetupCheck[] = [
    {
      id: "admin_password",
      label: "PLATFORM_ADMIN_PASSWORD",
      ok: !isProduction || adminPassword,
      hint: isProduction
        ? "Obligatoria en producción para el login de Qlykadmin"
        : "Opcional en local (hay fallback solo si NODE_ENV=development)",
    },
    {
      id: "cron_secret",
      label: "CRON_SECRET",
      ok: !isProduction || cronSecret,
      hint: cronSecret
        ? "El cron de liberación de monederos exige Authorization: Bearer $CRON_SECRET"
        : "Obligatoria en producción. Vercel la envía automáticamente al cron si está definida",
    },
    {
      id: "payment_bank",
      label: "SPEI (transferencia)",
      ok: manualPayments,
      hint: manualPayments
        ? `${paymentInstructions?.bankName} · CLABE configurada`
        : "Define PAYMENT_BANK_NAME, PAYMENT_BENEFICIARY y PAYMENT_CLABE. Es el método de cobro actual hasta Mercado Pago",
    },
    {
      id: "payments_any",
      label: "Al menos un método de cobro",
      ok: paymentsReady,
      hint: paymentsReady ? "SPEI configurado" : "Configura los datos SPEI para poder cobrar en producción",
    },
    {
      id: "blob",
      label: "BLOB_READ_WRITE_TOKEN",
      ok: blob || !manualPayments,
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
    if (check.id === "payment_bank") return false;
    return !check.ok;
  });

  return {
    checks,
    legal,
    payments: {
      manualEnabled: manualPayments,
      instructions: paymentInstructions,
    },
    environment: process.env.VERCEL_ENV ?? "development",
    readyForBeta: blockers.length === 0 && paymentsReady,
    allChecksPass: blockers.length === 0 && paymentsReady,
  };
}
