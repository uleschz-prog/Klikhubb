import { NextResponse } from "next/server";
import { paymentCookieOptions } from "@/lib/payments";
import {
  MercadoPagoNotConfiguredError,
  verifyApprovedContractPayment,
} from "@/lib/mercadopago";
import { requireApiUser } from "@/lib/supabase/require-api-user";
import { getAppUrl } from "@/lib/env";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  const origin = getAppUrl(request);
  if ("error" in auth) {
    return NextResponse.redirect(`${origin}/iniciar-sesion?next=/pago/exito`);
  }

  const paymentId = new URL(request.url).searchParams.get("payment_id");
  if (!paymentId) {
    return NextResponse.redirect(`${origin}/pago/exito?confirmed=0`);
  }

  try {
    const verified = await verifyApprovedContractPayment(paymentId);
    const belongsToUser = verified?.externalReference === auth.user.id;
    const redirectUrl = new URL("/pago/exito", origin);
    redirectUrl.searchParams.set("confirmed", belongsToUser ? "1" : "0");
    if (!verified || !belongsToUser) {
      redirectUrl.searchParams.set("payment_id", paymentId);
      return NextResponse.redirect(redirectUrl);
    }

    const response = NextResponse.redirect(redirectUrl);
    const cookie = paymentCookieOptions();
    response.cookies.set({
      name: cookie.name,
      value: verified.id,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
      path: cookie.path,
      maxAge: cookie.maxAge,
    });
    return response;
  } catch (error) {
    const reason =
      error instanceof MercadoPagoNotConfiguredError
        ? "config"
        : "verify";
    return NextResponse.redirect(
      `${origin}/pago/exito?confirmed=0&reason=${reason}`
    );
  }
}
