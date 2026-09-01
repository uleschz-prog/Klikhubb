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
      id: "payment_bank",
      label: "Datos bancarios SPEI",
      ok: manualPayments,
      hint: manualPayments
        ? `${paymentInstructions?.bankName} · CLABE configurada`
        : "Define PAYMENT_BANK_NAME, PAYMENT_BENEFICIARY y PAYMENT_CLABE en Vercel",
    },
    {
      id: "blob",
      label: "BLOB_READ_WRITE_TOKEN",
      ok: blob,
      hint: blob
        ? "Subida de comprobantes activa"
        : "Necesario para que los compradores adjunten comprobantes",
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

  const blockers = checks.filter((check) => !check.ok);

  return {
    checks,
    legal,
    payments: {
      manualEnabled: manualPayments,
      instructions: paymentInstructions,
    },
    environment: process.env.VERCEL_ENV ?? "development",
    readyForBeta: blockers.length === 0,
    allChecksPass: blockers.length === 0,
  };
}
