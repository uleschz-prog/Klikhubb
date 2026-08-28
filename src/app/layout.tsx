import type { Metadata, Viewport } from "next";
import { Outfit, Syne } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { PwaInstallHint } from "@/components/pwa/PwaInstallHint";
import { PwaRoot } from "@/components/pwa/PwaRoot";
import { site } from "@/config/site";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
    { media: "(prefers-color-scheme: light)", color: "#050505" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  metadataBase: new URL(site.url),
  applicationName: site.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: "black-translucent",
    startupImage: [
      {
        url: "/splash/iphone-14-pro-max-1290x2796.png",
        media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/iphone-14-pro-1179x2556.png",
        media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/iphone-13-1170x2532.png",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/iphone-12-pro-max-1284x2778.png",
        media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/iphone-se-750x1334.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/ipad-pro-12-2048x2732.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: site.url,
    siteName: site.name,
    title: site.share.title,
    description: site.share.description,
  },
  twitter: {
    card: "summary_large_image",
    title: site.share.title,
    description: site.share.description,
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${outfit.variable} ${syne.variable} bg-klik-black font-sans antialiased`}>
        <PwaRoot />
        <AppProviders>
          {children}
          <PwaInstallHint />
        </AppProviders>
      </body>
    </html>
  );
}
