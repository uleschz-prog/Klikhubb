import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { termsIntro, termsRelated, termsSections } from "@/content/legal/terms-content";

export const metadata: Metadata = {
  title: "Términos de Uso",
  description: "Condiciones de uso de Qlyk: registro, contenido, compras, compensación 93/7 o plan mensual y responsabilidades.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Términos de Uso"
      intro={termsIntro}
      sections={termsSections}
      related={termsRelated}
    />
  );
}
