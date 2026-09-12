"use client";

import Link from "next/link";
import type { FeedVideo } from "@/lib/video/types";
import { FeedTheater } from "@/components/video/FeedTheater";

/** Tienda: feed a pantalla completa (estilo TikTok) en móvil y escritorio. */
export function FeedEntry({
  videos,
  clipId,
  tab,
  signedIn,
  stripeEnabled,
  speiEnabled,
  buySlug,
  canceled,
}: {
  videos: FeedVideo[];
  clipId?: string;
  tab: "foryou" | "following" | "saved";
  signedIn: boolean;
  stripeEnabled: boolean;
  speiEnabled: boolean;
  buySlug?: string;
  canceled?: boolean;
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
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-klik-black px-6 text-center text-white">
        <h1 className="font-display text-3xl font-extrabold">{empty.title}</h1>
        <p className="mt-3 max-w-sm text-sm text-white/55">{empty.body}</p>
        <Link
          href={empty.href}
          className="mt-6 rounded-full bg-klik-green px-6 py-3 text-sm font-bold text-klik-black"
        >
          {empty.cta}
        </Link>
      </div>
    );
  }

  return (
    <FeedTheater
      home="shop"
      feedTab={tab}
      videos={theaterVideos}
      initialId={clipId}
      signedIn={signedIn}
      stripeEnabled={stripeEnabled}
      speiEnabled={speiEnabled}
      buySlug={buySlug}
      canceled={canceled}
    />
  );
}
