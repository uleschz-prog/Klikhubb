import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin";
import { probeStripeConnect } from "@/lib/commerce/stripe-connect";
import { getPlatformReadiness } from "@/lib/platform/readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Checklist de configuración para el operador (legal, Stripe, SPEI). */
export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const [readiness, connectLive] = await Promise.all([
    Promise.resolve(getPlatformReadiness()),
    probeStripeConnect(),
  ]);
  return NextResponse.json({ ...readiness, connectLive });
}
