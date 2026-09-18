import { NextResponse } from "next/server";
import { getVerifiedPaymentForUser } from "@/lib/payments";
import { requireApiUser } from "@/lib/supabase/require-api-user";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  try {
    const payment = await getVerifiedPaymentForUser(auth.user.id);
    return NextResponse.json({
      paid: Boolean(payment),
      payment,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo verificar el pago.";
    return NextResponse.json({ paid: false, error: message }, { status: 502 });
  }
}
