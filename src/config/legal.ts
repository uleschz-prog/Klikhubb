import { brand, site } from "@/config/site";

function env(name: string) {
  return process.env[name]?.trim() || "";
}

/** Datos del responsable legal. Completa LEGAL_* en Vercel antes del launch público. */
export const legalMeta = {
  brand: brand.name,
  siteUrl: site.url,
  operatorName: "Qlyk",
  get legalEntity() {
    return env("LEGAL_ENTITY_NAME") || "Titular de la plataforma Qlyk";
  },
  get taxId() {
    return env("LEGAL_TAX_ID");
  },
  get address() {
    return env("LEGAL_ADDRESS");
  },
  get contactEmail() {
    return env("LEGAL_CONTACT_EMAIL") || "qlykadmin@qlyk.app";
  },
  get privacyEmail() {
    return env("LEGAL_PRIVACY_EMAIL") || "privacidad@qlyk.app";
  },
  lastUpdated: "30 de agosto de 2026",
  version: "1.1",
};

export function legalIdentityComplete() {
  return Boolean(legalMeta.legalEntity !== "Titular de la plataforma Qlyk" && legalMeta.taxId && legalMeta.address);
}

export function legalIdentityParagraphs() {
  const contact = legalMeta.contactEmail;
  if (legalIdentityComplete()) {
    return [
      `Titular del servicio: ${legalMeta.legalEntity}.`,
      `Denominación comercial: ${legalMeta.operatorName}.`,
      `NIF/CIF: ${legalMeta.taxId}.`,
      `Domicilio: ${legalMeta.address}.`,
      `Contacto: ${contact}.`,
    ];
  }
  return [
    `Denominación comercial: ${legalMeta.operatorName}.`,
    `Los datos identificativos completos del titular (razón social, número fiscal y domicilio) se facilitan a petición en ${contact}.`,
    `Contacto: ${contact}.`,
  ];
}

export function legalPrivacyParagraphs() {
  const lines = legalIdentityComplete()
    ? [
        `Responsable: ${legalMeta.legalEntity}.`,
        `NIF/CIF: ${legalMeta.taxId}.`,
        `Domicilio: ${legalMeta.address}.`,
      ]
    : [
        `Responsable comercial: ${legalMeta.operatorName}.`,
        `Los datos identificativos completos del responsable se facilitan a petición en ${legalMeta.privacyEmail}.`,
      ];
  return [
    ...lines,
    `Correo de privacidad: ${legalMeta.privacyEmail}.`,
    `Correo general: ${legalMeta.contactEmail}.`,
    "No hemos designado Delegado de Protección de Datos (DPD) obligatorio. Para cualquier cuestión de privacidad utiliza el correo indicado.",
  ];
}

export type LegalBlock = {
  paragraphs?: string[];
  list?: string[];
};

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};
