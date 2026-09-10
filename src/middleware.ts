import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ensureNextAuthUrl } from "@/config/site-url.env.mjs";

if (!process.env.NEXTAUTH_SECRET?.trim()) {
  process.env.NEXTAUTH_SECRET = process.env.AUTH_SECRET?.trim() || "klikhubb-demo-secret";
}

ensureNextAuthUrl();

/** Retornos de Mercado Pago (back_urls) deben ser públicos; la sesión se usa luego en confirm. */
const PUBLIC_CHECKOUT_RETURNS = new Set([
  "/checkout/success",
  "/checkout/pending",
  "/checkout/failure",
]);

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    if (PUBLIC_CHECKOUT_RETURNS.has(path)) {
      return NextResponse.next();
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (PUBLIC_CHECKOUT_RETURNS.has(path)) return true;
        return Boolean(token);
      },
    },
  },
);

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/checkout/:path*",
    "/wallet",
    "/wallet/:path*",
    "/publish",
    "/publish/:path*",
    "/studio",
    "/studio/:path*",
  ],
};
