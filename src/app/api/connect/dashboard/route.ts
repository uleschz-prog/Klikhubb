import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { createConnectDashboardLink } from "@/lib/commerce/stripe-connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  }

  try {
    const url = await createConnectDashboardLink(userId);
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CONNECT_ERROR";
    if (message === "CONNECT_NOT_ENABLED") {
      return NextResponse.json({ error: "Stripe Connect no está activo." }, { status: 503 });
    }
    if (message === "CONNECT_NOT_CONNECTED") {
      return NextResponse.json({ error: "Primero conecta tu cuenta bancaria." }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "No pudimos abrir el panel Stripe." }, { status: 500 });
  }
}
