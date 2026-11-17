import { listPublishedVideos, listSavedVideos, getPublishedVideo } from "@/lib/video/feed";
import { getDbUserId, getSession } from "@/lib/auth/session";
import { getCheckoutMethods } from "@/config/checkout-methods";
import { FeedTheater } from "@/components/video/FeedTheater";
import { FeedEmptyState } from "@/components/video/FeedEmptyState";
import { resolveDisplayFxUsdMxn } from "@/lib/commerce/display-fx";
import { selectFeaturedCatalog } from "@/lib/video/catalog-trust";

export const dynamic = "force-dynamic";

function playTab(value?: string): "foryou" | "following" | "saved" {
  if (value === "following" || value === "saved") return value;
  return "foryou";
}

export default async function PlayPage({
  searchParams,
}: {
  searchParams: { v?: string; tab?: string; buy?: string; canceled?: string };
}) {
  const session = await getSession();
  const viewerId = await getDbUserId();
  const tab = playTab(searchParams.tab);
  const videos =
    tab === "saved" && viewerId
      ? await listSavedVideos(40, viewerId, "PLAY")
      : await listPublishedVideos(40, viewerId ?? undefined, "PLAY");
  const focused =
    searchParams.v && !videos.some((item) => item.id === searchParams.v)
      ? await getPublishedVideo(searchParams.v, viewerId ?? undefined)
      : null;
  const catalog = tab === "foryou" && !searchParams.v ? selectFeaturedCatalog(videos) : videos;
  const theaterVideos = [
    ...(focused ? [focused] : []),
    ...(tab === "following" ? catalog.filter((video) => video.followedByMe) : catalog),
  ];

  if (tab === "saved" && !viewerId) {
    return (
      <FeedEmptyState
        kicker="Guardados"
        title="Entra para ver lo que guardaste"
        body="La estrella se queda en tu cuenta, no en el teléfono."
        actionHref={`/login?callbackUrl=${encodeURIComponent("/play?tab=saved")}`}
        actionLabel="Entrar"
      />
    );
  }

  if (theaterVideos.length === 0 && tab === "foryou") {
    return (
      <FeedEmptyState
        kicker="Inicio"
        title="Aún no hay videos de creadores"
        body="Aquí vas a ver clips originales publicados en Qlyk. Sube el tuyo si quieres ser de los primeros."
        actionHref="/publish?lane=play"
        actionLabel="Subir video"
      />
    );
  }

  if (tab === "following" && theaterVideos.length === 0) {
    return (
      <FeedEmptyState
        kicker="Siguiendo"
        title="Todavía no sigues a nadie"
        body="En Para ti, toca el + bajo el avatar. Quien sigas aparece aquí."
        actionHref="/play"
        actionLabel="Ir a Para ti"
      />
    );
  }

  if (tab === "saved" && theaterVideos.length === 0) {
    return (
      <FeedEmptyState
        kicker="Guardados"
        title="Todavía no guardas nada"
        body="En un clip, toca la estrella. Aquí se queda."
        actionHref="/play"
        actionLabel="Ir a Para ti"
      />
    );
  }

  const methods = getCheckoutMethods();

  return (
    <FeedTheater
      home="play"
      feedTab={tab}
      videos={theaterVideos}
      initialId={searchParams.v}
      signedIn={Boolean(session?.user)}
      speiEnabled={methods.spei}
      buySlug={searchParams.buy}
      canceled={searchParams.canceled === "1"}
      fxRate={resolveDisplayFxUsdMxn()}
    />
  );
}
