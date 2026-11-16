import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { PayoutDestinationError, saveUsdtPayoutAddress } from "@/lib/commerce/payouts";
import { usdtAddressSchema } from "@/lib/validations/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para guardar tu dirección." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = usdtAddressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Escribe una dirección USDT TRC20 válida." }, { status: 400 });
  }

  try {
    const result = await saveUsdtPayoutAddress(userId, parsed.data.address);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof PayoutDestinationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo guardar la dirección." }, { status: 500 });
  }
}
