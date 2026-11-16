import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/auth";
import { releaseMatureCommissions } from "@/lib/commerce/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const result = await releaseMatureCommissions();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo liberar el hold." }, { status: 500 });
  }
}
