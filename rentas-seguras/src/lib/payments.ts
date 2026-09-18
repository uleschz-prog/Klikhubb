import { cookies } from "next/headers";
import { PAYMENT_COOKIE } from "@/lib/constants";
import {
  MercadoPagoNotConfiguredError,
  verifyApprovedContractPayment,
} from "@/lib/mercadopago";

export function readPaymentCookie() {
  return cookies().get(PAYMENT_COOKIE)?.value ?? null;
}

export function paymentCookieOptions() {
  return {
    name: PAYMENT_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export async function getVerifiedPaymentFromCookie() {
  const paymentId = readPaymentCookie();
  if (!paymentId) return null;

  try {
    return await verifyApprovedContractPayment(paymentId);
  } catch (error) {
    if (error instanceof MercadoPagoNotConfiguredError) {
      return null;
    }
    throw error;
  }
}
