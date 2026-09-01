import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin";
import { getPlatformReadiness } from "@/lib/platform/readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Checklist de configuración para el operador (legal, pagos SPEI). */
export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  return NextResponse.json(getPlatformReadiness());
}
