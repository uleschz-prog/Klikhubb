import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { createConnectOnboardingLink, loadConnectStatus } from "@/lib/commerce/stripe-connect";

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
        { error: "Stripe Connect no está activo. Activa STRIPE_CONNECT_ENABLED en Vercel." },
        { status: 503 },
      );
    }
    if (message === "USER_EMAIL_REQUIRED") {
      return NextResponse.json({ error: "Necesitas un email en tu cuenta." }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "No pudimos abrir Stripe Connect." }, { status: 500 });
  }
}
