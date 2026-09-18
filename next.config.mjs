import { ensureNextAuthUrl } from "./src/config/site-url.env.mjs";

ensureNextAuthUrl();

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/academy", destination: "/cursos", permanent: true },
      { source: "/academy/cursos", destination: "/cursos", permanent: true },
      { source: "/academy/studio", destination: "/cursos", permanent: true },
      { source: "/academy/red", destination: "/cursos", permanent: true },
      { source: "/academy/:slug", destination: "/learn/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
