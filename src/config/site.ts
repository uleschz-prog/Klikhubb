export const brand = {
  name: "KlikHubb",
  slogan: "El centro donde todo sucede con un solo clic.",
  colors: {
    black: "#050505",
    green: "#00FF41",
    cyan: "#00F0FF",
  },
} as const;

export function siteUrl() {
  const explicit = process.env.NEXTAUTH_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export const site = {
  name: brand.name,
  slogan: brand.slogan,
  url: siteUrl(),
  description:
    "La red social donde publicas, vendes y tu gente se queda contigo. Video, comunidad y academia en un clic.",
} as const;
