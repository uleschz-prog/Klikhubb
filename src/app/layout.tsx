import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
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

export const metadata: Metadata = {
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  metadataBase: new URL(site.url),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${outfit.variable} ${syne.variable} bg-klik-black font-sans antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
