"use client";

import type { FeedVideo } from "@/lib/video/types";
import { FeedTheater } from "@/components/video/FeedTheater";
import { FeedEmptyState } from "@/components/video/FeedEmptyState";

/** Tienda: feed a pantalla completa (estilo TikTok) en móvil y escritorio. */
export function FeedEntry({
  videos,
  clipId,
  tab,
  signedIn,
  speiEnabled,
  buySlug,
  canceled,
  fxRate,
}: {
  videos: FeedVideo[];
  clipId?: string;
  tab: "foryou" | "following" | "saved";
  signedIn: boolean;
  speiEnabled: boolean;
  buySlug?: string;
  canceled?: boolean;
  fxRate?: number;
}) {
  const theaterVideos =
    tab === "following" && !clipId
      ? videos.filter((video) => video.followedByMe)
      : tab === "saved" && !clipId
        ? videos.filter((video) => video.savedByMe)
        : videos;

  if (!clipId && !buySlug && theaterVideos.length === 0) {
    const empty =
      tab === "following"
        ? {
            title: signedIn ? "Todavía no sigues a nadie" : "Entra para ver a quien sigues",
            body: signedIn
              ? "En un video toca el + bajo el avatar. Quien sigas aparece aquí."
              : "El follow se guarda en tu cuenta.",
            href: signedIn ? "/feed" : `/login?callbackUrl=${encodeURIComponent("/feed?tab=following")}`,
            cta: signedIn ? "Ver Tienda" : "Entrar",
          }
        : tab === "saved"
          ? {
              title: signedIn ? "Todavía no guardas nada" : "Entra para ver tus guardados",
              body: signedIn
                ? "En un clip toca la estrella. Aquí se queda."
                : "La estrella se guarda en tu cuenta.",
              href: signedIn ? "/feed" : `/login?callbackUrl=${encodeURIComponent("/feed?tab=saved")}`,
              cta: signedIn ? "Ver Tienda" : "Entrar",
            }
          : {
              title: "La Tienda está vacía",
              body: "Sé el primero en vender desde un video.",
              href: "/publish",
              cta: "Publicar",
            };

    return (
      <FeedEmptyState
        titleShell="Tienda"
        kicker="Tienda"
        title={empty.title}
        body={empty.body}
        actionHref={empty.href}
        actionLabel={empty.cta}
      />
    );
  }

  return (
    <FeedTheater
      home="shop"
      feedTab={tab}
      videos={theaterVideos}
      initialId={clipId}
      signedIn={signedIn}
      speiEnabled={speiEnabled}
      buySlug={buySlug}
      canceled={canceled}
      fxRate={fxRate}
    />
  );
}
