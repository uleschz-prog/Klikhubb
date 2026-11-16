import { legalIdentityComplete, legalMeta } from "@/config/legal";
import { getPaymentInstructions, isManualPaymentsConfigured } from "@/config/payment-instructions";
import { isMercadoPagoConfigured, getMercadoPagoWebhookSecret, getMercadoPagoPublicKey } from "@/lib/payments/mercadopago";
import { envFxOverride } from "@/lib/payments/fx";
import {
  isMercadoPagoPayoutsFlagOn,
  isMercadoPagoPayoutsReady,
  isMercadoPagoPayoutsSandbox,
  getMercadoPagoPayoutsPrivateKey,
} from "@/lib/payments/mp-payouts";

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
  const mercadoPago = isMercadoPagoConfigured();
  const mercadoPagoReady = mercadoPago && Boolean(getMercadoPagoWebhookSecret() && getMercadoPagoPublicKey());
  const paymentsReady = mercadoPagoReady || manualPayments;
  const fxOverride = envFxOverride();
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
      id: "mercadopago",
      label: "Mercado Pago Checkout Pro",
      ok: mercadoPagoReady,
      hint: mercadoPagoReady
        ? "Checkout Pro listo (token, public key y webhook secret)"
        : mercadoPago
          ? "Faltan MP_PUBLIC_KEY o MP_WEBHOOK_SECRET"
          : "Define MP_ACCESS_TOKEN, MP_PUBLIC_KEY y MP_WEBHOOK_SECRET. Webhook: /api/webhooks/mercadopago",
    },
    {
      id: "fx_rate",
      label: "Tipo de cambio USD→MXN",
      ok: Boolean(fxOverride) || mercadoPago,
      hint: fxOverride
        ? `FX_USD_MXN=${fxOverride} (se usa este valor fijo)`
        : mercadoPago
          ? "Se toma de la API de Mercado Pago y se cachea 1 hora. Opcional: FX_USD_MXN"
          : "Define FX_USD_MXN o configura Mercado Pago para obtener el tipo de cambio",
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
      hint: paymentsReady ? [mercadoPagoReady ? "Mercado Pago" : null, manualPayments ? "SPEI" : null].filter(Boolean).join(" + ") : "Configura Mercado Pago o los datos SPEI",
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
      id: "mp_payouts",
      label: "Retiros a Mercado Pago",
      ok: !isMercadoPagoPayoutsFlagOn() || isMercadoPagoPayoutsReady(),
      hint: !isMercadoPagoPayoutsFlagOn()
        ? "MP_PAYOUTS_ENABLED no está activo: los retiros se marcan a mano en /admin/payouts"
        : isMercadoPagoPayoutsReady()
          ? isMercadoPagoPayoutsSandbox()
            ? "Payouts en sandbox (X-test-token). El creador guarda su correo MP en /wallet"
            : "Payouts listos en producción (token + firma Ed25519)"
          : getMercadoPagoPayoutsPrivateKey()
            ? "Falta MP_ACCESS_TOKEN o el flag no quedó bien configurado"
            : "Activo, pero en producción hace falta MP_PAYOUTS_PRIVATE_KEY (Ed25519 registrada ante MP). Hasta entonces el admin paga a mano",
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
    if (check.id === "payment_bank" || check.id === "mercadopago" || check.id === "mp_payouts") return false;
    return !check.ok;
  });

  return {
    checks,
    legal,
    payments: {
      mercadoPagoEnabled: mercadoPagoReady,
      manualEnabled: manualPayments,
      instructions: paymentInstructions,
    },
    environment: process.env.VERCEL_ENV ?? "development",
    readyForBeta: blockers.length === 0 && paymentsReady,
    allChecksPass: blockers.length === 0 && paymentsReady,
  };
}
