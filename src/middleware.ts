if (!process.env.NEXTAUTH_SECRET?.trim()) {
  process.env.NEXTAUTH_SECRET = process.env.AUTH_SECRET?.trim() || "klikhubb-demo-secret";
}

if (!process.env.NEXTAUTH_URL?.trim()) {
  process.env.NEXTAUTH_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
    : "http://localhost:3000";
}

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
