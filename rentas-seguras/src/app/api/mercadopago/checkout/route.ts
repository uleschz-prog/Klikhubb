import { NextResponse } from "next/server";
import { getAppUrl, getMercadoPagoWebhookSecret } from "@/lib/env";
import {
  createContractPreference,
  MercadoPagoNotConfiguredError,
} from "@/lib/mercadopago";
import { requireApiUser } from "@/lib/supabase/require-api-user";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const origin = getAppUrl(request);
  const webhookSecret = getMercadoPagoWebhookSecret();
  const notificationUrl = webhookSecret
    ? `${origin}/api/mercadopago/webhook?secret=${encodeURIComponent(webhookSecret)}`
    : `${origin}/api/mercadopago/webhook`;

  try {
    const checkout = await createContractPreference({
      userId: auth.user.id,
      email: auth.user.email ?? undefined,
      successUrl: `${origin}/pago/exito`,
      failureUrl: `${origin}/pago/fallo`,
      pendingUrl: `${origin}/pago/pendiente`,
      notificationUrl,
    });

    return NextResponse.json(checkout);
  } catch (error) {
    if (error instanceof MercadoPagoNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo crear el Checkout de MercadoPago.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
