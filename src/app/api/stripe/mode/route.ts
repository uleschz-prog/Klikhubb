import { NextResponse } from "next/server";
import { getStripeKeyMode, isStripeEnabled } from "@/lib/commerce/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Diagnóstico: confirma si Vercel usa sk_test_ o sk_live_ (sin revelar la clave). */
export async function GET() {
  const mode = getStripeKeyMode();
  return NextResponse.json({
    stripeEnabled: isStripeEnabled(),
    mode,
    hint:
      mode === "live"
        ? "Estás en Live: la tarjeta 4242 no funciona. Usa tarjetas reales o cambia a sk_test_ para pruebas."
        : mode === "test"
          ? "Modo Test OK: puedes usar 4242 4242 4242 4242."
          : "STRIPE_SECRET_KEY no configurada o prefijo inválido.",
  });
}
