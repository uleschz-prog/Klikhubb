import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: `${site.name} — ${site.slogan}`,
  description: site.description,
};

export default function HomePage() {
  return <LandingPage />;
}
