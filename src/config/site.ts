import {
  LEGACY_PRODUCTION_URL,
  PRODUCTION_URL,
  ensureNextAuthUrl,
  normalizePublicUrl,
  resolveSiteUrl,
} from "./site-url.env.mjs";

export { PRODUCTION_URL, LEGACY_PRODUCTION_URL };

export const brand = {
  name: "Qlyk",
  slogan: "El centro donde todo sucede con un solo clic.",
  colors: {
    black: "#050505",
    green: "#00FF41",
    cyan: "#00F0FF",
  },
} as const;

ensureNextAuthUrl();

export function siteUrl() {
  return resolveSiteUrl();
}

export const site = {
  name: brand.name,
  slogan: brand.slogan,
  url: siteUrl(),
  description:
    "La red social donde publicas, vendes y tu gente se queda contigo. Video, comunidad y academia en un clic.",
  share: {
    title: "Qlyk — Del video al pago. Sin salir del feed.",
    description:
      "Publica, vende y cobra en el mismo feed. Cuenta gratis, registro directo.",
  },
} as const;

export function referralLink(code: string) {
  const base = normalizePublicUrl(site.url);
  const params = new URLSearchParams({ ref: code });
  return `${base}/register?${params.toString()}`;
}
