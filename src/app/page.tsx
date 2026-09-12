import type { Metadata } from "next";
import Script from "next/script";
import { LandingPage } from "@/components/landing/LandingPage";
import { LANDING_THEME_BOOT_SCRIPT } from "@/components/landing/landing-theme-boot";
import { site } from "@/config/site";
import { listPublishedVideos } from "@/lib/video/feed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${site.name} — Videos para ver y comprar`,
  description: "Mira videos. Si te gustan, cómpralos. Simple.",
  openGraph: {
    title: `${site.name} — Videos para ver y comprar`,
    description: "Mira videos. Si te gustan, cómpralos. Simple.",
    url: site.url,
  },
  twitter: {
    title: `${site.name} — Videos para ver y comprar`,
    description: "Mira videos. Si te gustan, cómpralos. Simple.",
  },
};

export default async function HomePage() {
  const videos = await listPublishedVideos(24).catch(() => []);
  return (
    <>
      <Script id="landing-theme-boot" strategy="beforeInteractive">
        {LANDING_THEME_BOOT_SCRIPT}
      </Script>
      <LandingPage videos={videos} />
    </>
  );
}
