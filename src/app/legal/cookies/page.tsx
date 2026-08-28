import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { cookiesIntro, cookiesRelated, cookiesSections } from "@/content/legal/cookies-content";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Cookies y tecnologías similares utilizadas en Qlyk y cómo gestionarlas.",
};

export default function CookiesPage() {
  return (
    <LegalDocument
      title="Política de Cookies"
      intro={cookiesIntro}
      sections={cookiesSections}
      related={cookiesRelated}
    />
  );
}
