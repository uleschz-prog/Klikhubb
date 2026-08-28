import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: `${site.name} — ${site.slogan}`,
  description: site.share.description,
  openGraph: {
    title: site.share.title,
    description: site.share.description,
    url: site.url,
  },
  twitter: {
    title: site.share.title,
    description: site.share.description,
  },
};

export default function HomePage() {
  return <LandingPage />;
}
