import type { Metadata } from "next";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingPage } from "@/components/landing/LandingPage";
import { site } from "@/config/site";
import { resolveDisplayFxUsdMxn } from "@/lib/commerce/display-fx";
import { listPublishedVideos } from "@/lib/video/feed";
import { selectFeaturedCatalog } from "@/lib/video/catalog-trust";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${site.name} — Videos para ver y comprar`,
  description: "Mira videos. Si te gustan, cómpralos. Simple.",
  openGraph: {
    title: `${site.name} — Videos para ver y comprar`,
    description: "Mira videos. Si te gustan, cómpralos. Simple.",
    url: site.url,
    images: [{ url: `${site.url}/opengraph-image`, width: 1200, height: 630, alt: `${site.name}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Videos para ver y comprar`,
    description: "Mira videos. Si te gustan, cómpralos. Simple.",
  },
};

export default async function HomePage() {
  const videos = await listPublishedVideos(24).catch(() => []);
  const featured = selectFeaturedCatalog(videos);
  return (
    <LandingPage videos={featured} fxRate={resolveDisplayFxUsdMxn()} hero={<LandingHero />} />
  );
}
