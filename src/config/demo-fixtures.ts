/** Identificadores de usuarios, productos y videos ficticios usados solo en desarrollo/seed. */
export const DEMO_USER_EMAILS = [
  "maya@klikhubb.dev",
  "leo@klikhubb.dev",
  "amina@klikhubb.dev",
  "rafa@klikhubb.dev",
  "platform@klikhubb.internal",
] as const;

export const DEMO_PRODUCT_SLUGS = ["cierre-elite", "inner-circle", "red-binaria"] as const;

export const DEMO_VIDEO_IDS = ["vid_maya_cierre", "vid_leo_inner", "vid_amina_clic"] as const;

/** Bootstrap antiguo con video hero demo (no es contenido de creador real). */
export const PLACEHOLDER_BOOTSTRAP = {
  courseSlug: "empieza-en-qlyk",
  shopClipTitle: "Empieza en Qlyk — curso oficial",
  playClipTitle: "Así se ve Qlyk",
  videoUrlMarker: "qlyk-hero-demo",
} as const;
