import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { requestPayout, WalletError } from "@/lib/commerce/wallet";
import { payoutSchema } from "@/lib/validations/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para retirar." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = payoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Monto no válido." }, { status: 400 });
  }

  try {
    const result = await requestPayout(userId, parsed.data.amount);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof WalletError) {
      const status = error.code === "USER_NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo solicitar el retiro." }, { status: 500 });
  }
}
