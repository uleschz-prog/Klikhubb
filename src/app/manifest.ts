import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "qlyk-pwa",
    name: "Qlyk — Del video al pago",
    short_name: "Qlyk",
    description: site.description,
    start_url: "/play?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#050505",
    theme_color: "#050505",
    lang: "es",
    dir: "ltr",
    categories: ["social", "entertainment", "education", "business"],
    prefer_related_applications: false,
    icons: [
      { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png", purpose: "any" },
      { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png", purpose: "any" },
      { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png", purpose: "any" },
      { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png", purpose: "any" },
      { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Play",
        short_name: "Play",
        url: "/play?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Tienda",
        short_name: "Tienda",
        url: "/feed?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Hub",
        short_name: "Hub",
        url: "/dashboard?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Monedero",
        short_name: "Wallet",
        url: "/wallet?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
