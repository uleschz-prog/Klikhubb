import type { Metadata } from "next";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingPage } from "@/components/landing/LandingPage";
import { CREATOR_FLAT_PRICE_USD, CREATOR_PLAN_FLAT, CREATOR_PLAN_PAYG } from "@/config/compensation-plan";
import { site } from "@/config/site";
import { resolveDisplayFxUsdMxn } from "@/lib/commerce/display-fx";
import { listPublishedVideos } from "@/lib/video/feed";
import { selectFeaturedCatalog } from "@/lib/video/catalog-trust";

export const dynamic = "force-dynamic";

const landingDescription = `Vende cursos y videos en Qlyk. Sin mensualidad te quedas el ${Math.round(CREATOR_PLAN_PAYG.creatorRate * 100)}%. Con el ${CREATOR_PLAN_FLAT.label.toLowerCase()} de $${CREATOR_FLAT_PRICE_USD} USD, el ${Math.round(CREATOR_PLAN_FLAT.creatorRate * 100)}%. Retiro desde 24 horas.`;

export const metadata: Metadata = {
  title: `${site.name} — Vende cursos y videos. Quédate hasta el 100%.`,
  description: landingDescription,
  openGraph: {
    title: `${site.name} — Vende cursos y videos. Quédate hasta el 100%.`,
    description: landingDescription,
    url: site.url,
    images: [{ url: `${site.url}/opengraph-image`, width: 1200, height: 630, alt: `${site.name}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Vende cursos y videos. Quédate hasta el 100%.`,
    description: landingDescription,
  },
};

export default async function HomePage() {
  const videos = await listPublishedVideos(24).catch(() => []);
  const featured = selectFeaturedCatalog(videos);
  return (
    <LandingPage videos={featured} fxRate={resolveDisplayFxUsdMxn()} hero={<LandingHero />} />
  );
}
