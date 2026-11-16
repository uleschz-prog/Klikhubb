import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/auth";
import { syncOpenMercadoPagoPayouts } from "@/lib/commerce/payouts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const result = await syncOpenMercadoPagoPayouts();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo sincronizar los retiros." }, { status: 500 });
  }
}
