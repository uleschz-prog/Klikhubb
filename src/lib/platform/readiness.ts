import { legalIdentityComplete, legalMeta } from "@/config/legal";
import { getStripeKeyMode, isStripeEnabled } from "@/lib/commerce/stripe";
import { isConnectPayoutsEnabled } from "@/lib/commerce/stripe-connect";

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
  const stripeEnabled = isStripeEnabled();
  const stripeMode = getStripeKeyMode();
  const webhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  const connectEnabled = isConnectPayoutsEnabled();
  const connectCountry = process.env.STRIPE_CONNECT_COUNTRY?.trim().toUpperCase() || "MX";
  const adminPassword = Boolean(process.env.PLATFORM_ADMIN_PASSWORD?.trim());
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
      id: "stripe_key",
      label: "STRIPE_SECRET_KEY",
      ok: stripeEnabled && stripeMode !== null,
      hint:
        stripeMode === "live"
          ? "Modo Live — tarjetas reales"
          : stripeMode === "test"
            ? "Modo Test — puedes usar 4242…"
            : "Define sk_test_ o sk_live_ en Vercel",
    },
    {
      id: "stripe_webhook",
      label: "STRIPE_WEBHOOK_SECRET",
      ok: webhookSecret,
      hint: "whsec_ del webhook activo en Stripe Dashboard (mismo modo que la clave)",
    },
    {
      id: "stripe_connect",
      label: "Stripe Connect activo",
      ok: connectEnabled,
      hint: connectEnabled
        ? `Connect ON · país ${connectCountry}`
        : "STRIPE_CONNECT_ENABLED=true en Vercel + Connect activado en Stripe Dashboard",
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
  const readyForBeta = blockers.filter((check) => check.id !== "stripe_connect").length === 0;

  return {
    checks,
    legal,
    stripe: {
      enabled: stripeEnabled,
      mode: stripeMode,
      webhookSecret,
      connectEnabled,
      connectCountry,
    },
    environment: process.env.VERCEL_ENV ?? "development",
    readyForBeta,
    allChecksPass: blockers.length === 0,
  };
}
