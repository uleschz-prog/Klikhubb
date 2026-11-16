import { ensureNextAuthUrl } from "@/config/site-url.env.mjs";
import { resolveNextAuthSecret } from "@/lib/auth/secret";

process.env.NEXTAUTH_SECRET = resolveNextAuthSecret();

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
