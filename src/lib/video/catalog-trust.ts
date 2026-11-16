import { youtubeVideoId } from "@/lib/video/source";

/**
 * Señales de clips de terceros (YouTube / marcas de agua conocidas)
 * que no deben aparecer como catálogo destacado en landing o /play.
 * El contenido propio de creadores (archivos subidos, cursos) sigue visible.
 */
const THIRD_PARTY_MARKERS = [
  "comic-universe",
  "comicuniverse",
  "@comic-universe",
  "isekai anime",
];

export type CatalogTrustInput = {
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  title?: string | null;
  caption?: string | null;
};

export function isThirdPartyFeaturedVideo(video: CatalogTrustInput): boolean {
  if (youtubeVideoId(video.videoUrl ?? "") || youtubeVideoId(video.thumbnailUrl ?? "")) {
    return true;
  }
  const haystack = `${video.videoUrl ?? ""} ${video.thumbnailUrl ?? ""} ${video.title ?? ""} ${video.caption ?? ""}`.toLowerCase();
  return THIRD_PARTY_MARKERS.some((marker) => haystack.includes(marker));
}

/** Filtra el catálogo destacado (landing, Inicio/Tienda por defecto). */
export function selectFeaturedCatalog<T extends CatalogTrustInput>(videos: T[]): T[] {
  return videos.filter((video) => !isThirdPartyFeaturedVideo(video));
}
