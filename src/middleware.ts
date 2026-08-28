import { ensureNextAuthUrl } from "@/config/site-url.env.mjs";

if (!process.env.NEXTAUTH_SECRET?.trim()) {
  process.env.NEXTAUTH_SECRET = process.env.AUTH_SECRET?.trim() || "klikhubb-demo-secret";
}

ensureNextAuthUrl();

export { default } from "next-auth/middleware";

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
