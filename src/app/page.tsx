import type { Metadata } from "next";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingPage } from "@/components/landing/LandingPage";
import { site } from "@/config/site";
import { resolveDisplayFxUsdMxn } from "@/lib/commerce/display-fx";
import { listPublishedVideos } from "@/lib/video/feed";
import { selectFeaturedCatalog } from "@/lib/video/catalog-trust";

export const dynamic = "force-dynamic";

const landingDescription =
  "Publica cursos y clips, reúne a tu gente y cobra en tu monedero. Empiezas gratis, sin mensualidad. Precios en MXN y USD. Retiro desde 24 horas.";

export const metadata: Metadata = {
  title: `${site.name} — Convierte lo que sabes en ingresos`,
  description: landingDescription,
  openGraph: {
    title: `${site.name} — Convierte lo que sabes en ingresos`,
    description: landingDescription,
    url: site.url,
    images: [{ url: `${site.url}/opengraph-image`, width: 1200, height: 630, alt: `${site.name}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Convierte lo que sabes en ingresos`,
    description: landingDescription,
  },
};

export default async function HomePage() {
  const videos = await listPublishedVideos(24).catch(() => []);
  const featured = selectFeaturedCatalog(videos);
  const fxRate = resolveDisplayFxUsdMxn();
  return (
    <LandingPage videos={featured} fxRate={fxRate} hero={<LandingHero fxRate={fxRate} />} />
  );
}
