import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import {
  createConnectOnboardingLink,
  loadConnectStatus,
  stripeErrorMessage,
} from "@/lib/commerce/stripe-connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  }

  const status = await loadConnectStatus(userId);
  return NextResponse.json(status);
}

function connectFailureMessage(message: string) {
  if (/signed up for Connect|not signed up for Connect|Connect is not enabled/i.test(message)) {
    return "Stripe Connect no está activo en el Dashboard. En Stripe: Settings → Connect → Get started.";
  }
  if (/country/i.test(message) && /invalid|unsupported/i.test(message)) {
    return "El país de Connect no coincide. Revisa STRIPE_CONNECT_COUNTRY.";
  }
  if (/v2\/core\/accounts|Accounts v2|use the Accounts v2/i.test(message)) {
    return "Stripe pide Accounts v2. Recarga e intenta vincular de nuevo.";
  }
  return "No pudimos abrir Stripe para vincular tu cuenta.";
}

export async function POST() {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  }

  try {
    const link = await createConnectOnboardingLink(userId);
    return NextResponse.json({ ok: true, url: link.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CONNECT_ERROR";
    if (message === "CONNECT_NOT_ENABLED") {
      return NextResponse.json(
        { error: "Stripe Connect no está activo. Revisa STRIPE_SECRET_KEY en Vercel." },
        { status: 503 },
      );
    }
    if (message === "USER_EMAIL_REQUIRED") {
      return NextResponse.json({ error: "Necesitas un email en tu cuenta." }, { status: 400 });
    }
    console.error(error);
    const stripeMessage = stripeErrorMessage(error);
    return NextResponse.json(
      {
        error: connectFailureMessage(stripeMessage),
        detail: stripeMessage,
      },
      { status: 500 },
    );
  }
}
