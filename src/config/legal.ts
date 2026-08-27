import { brand, site } from "@/config/site";

/** Datos del responsable legal. Completa razón social, NIF y domicilio antes del launch formal. */
export const legalMeta = {
  brand: brand.name,
  siteUrl: site.url,
  operatorName: "Qlyk",
  legalEntity: process.env.LEGAL_ENTITY_NAME?.trim() || "Titular de la plataforma Qlyk",
  taxId: process.env.LEGAL_TAX_ID?.trim() || "[NIF/CIF — completar]",
  address: process.env.LEGAL_ADDRESS?.trim() || "[Domicilio social — completar]",
  contactEmail: process.env.LEGAL_CONTACT_EMAIL?.trim() || "qlykadmin@qlyk.app",
  privacyEmail: process.env.LEGAL_PRIVACY_EMAIL?.trim() || "privacidad@qlyk.app",
  lastUpdated: "27 de agosto de 2026",
  version: "1.0",
} as const;

export type LegalBlock = {
  paragraphs?: string[];
  list?: string[];
};

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};
