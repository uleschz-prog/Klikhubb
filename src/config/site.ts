export const brand = {
  name: "KlikHubb",
  slogan: "El centro donde todo sucede con un solo clic.",
  colors: {
    black: "#050505",
    green: "#00FF41",
    cyan: "#00F0FF",
  },
} as const;

export const site = {
  name: brand.name,
  slogan: brand.slogan,
  url: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  description:
    "La red social donde publicas, vendes y tu gente se queda contigo. Video, comunidad y academia en un clic.",
} as const;
