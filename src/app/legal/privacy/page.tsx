import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { privacyIntro, privacyRelated, privacySections } from "@/content/legal/privacy-content";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Cómo Qlyk trata tus datos personales, bases legales, derechos y conservación.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Política de Privacidad"
      intro={privacyIntro}
      sections={privacySections}
      related={privacyRelated}
    />
  );
}
