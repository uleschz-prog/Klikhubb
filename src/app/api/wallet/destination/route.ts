import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { PayoutDestinationError, saveMpPayoutEmail } from "@/lib/commerce/payouts";
import { mpPayoutEmailSchema } from "@/lib/validations/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para guardar tu cuenta." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = mpPayoutEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Escribe un correo válido de Mercado Pago." }, { status: 400 });
  }

  try {
    const result = await saveMpPayoutEmail(userId, parsed.data.email);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof PayoutDestinationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo guardar el correo." }, { status: 500 });
  }
}
