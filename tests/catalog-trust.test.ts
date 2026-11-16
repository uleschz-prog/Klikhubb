import { describe, expect, it } from "vitest";
import { isThirdPartyFeaturedVideo, selectFeaturedCatalog } from "@/lib/video/catalog-trust";

describe("catálogo destacado", () => {
  it("excluye URLs de YouTube", () => {
    expect(
      isThirdPartyFeaturedVideo({
        title: "Mi clase",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      }),
    ).toBe(true);
  });

  it("excluye marcas de agua de terceros conocidas", () => {
    expect(
      isThirdPartyFeaturedVideo({
        title: "Isekai anime",
        caption: "clip con @Comic-Universe-ES",
        videoUrl: "https://example.public.blob.vercel-storage.com/clip.mp4",
      }),
    ).toBe(true);
  });

  it("deja pasar contenido propio de un creador", () => {
    const own = {
      title: "Cierre Qlyk — preview del curso",
      caption: "Entra, paga una vez y continúa. #qlyk #cierre",
      videoUrl: "https://example.public.blob.vercel-storage.com/cierre.mp4",
    };
    expect(isThirdPartyFeaturedVideo(own)).toBe(false);
    expect(selectFeaturedCatalog([own, { title: "Isekai anime", videoUrl: null }])).toEqual([own]);
  });
});
