/** Identificadores de usuarios, productos y videos ficticios usados solo en desarrollo/seed. */
export const DEMO_USER_EMAILS = [
  "maya@klikhubb.dev",
  "leo@klikhubb.dev",
  "amina@klikhubb.dev",
  "rafa@klikhubb.dev",
  "platform@klikhubb.internal",
] as const;

export const DEMO_USERNAMES = ["mayaclose", "leov", "amina", "rafa"] as const;

export const DEMO_PRODUCT_SLUGS = ["cierre-elite", "inner-circle", "red-binaria"] as const;

export const DEMO_VIDEO_IDS = ["vid_maya_cierre", "vid_leo_inner", "vid_amina_clic"] as const;

/** Bootstrap antiguo con video hero demo (no es contenido de creador real). */
export const PLACEHOLDER_BOOTSTRAP = {
  courseSlug: "empieza-en-qlyk",
  shopClipTitle: "Empieza en Qlyk — curso oficial",
  playClipTitle: "Así se ve Qlyk",
  videoUrlMarker: "qlyk-hero-demo",
} as const;

/** Assets locales de demo en /public/videos (no deben aparecer en el feed). */
export const PLACEHOLDER_ASSET_MARKERS = [
  "qlyk-hero-demo",
  "maya-cierre",
  "leo-inner",
  "amina-clic",
] as const;

/**
 * Títulos/captions conocidos de clips placeholder en producción
 * (bootstrap + posts de prueba del admin).
 */
export const PLACEHOLDER_FEED_TITLES = [
  PLACEHOLDER_BOOTSTRAP.shopClipTitle,
  PLACEHOLDER_BOOTSTRAP.playClipTitle,
  "usa ia y vende en modo piloto con un clic.",
  "El cierre que convierte. Tu producto, tu clip. #qlyk",
  "El botón vende",
  "Audiencia propia",
] as const;

export const PLACEHOLDER_CAPTION_MARKERS = [
  "Tu primer curso en Qlyk: publica, vende y cobra con la red",
  "usa ia y vende en modo piloto",
  "El cierre que convierte. Tu producto, tu clip",
  "Empaqué mi curso en 18 segundos",
  "Mi comunidad no es un chat suelto",
] as const;

export function isPlaceholderMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return PLACEHOLDER_ASSET_MARKERS.some((marker) => url.includes(marker));
}
