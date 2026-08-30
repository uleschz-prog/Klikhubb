import Link from "next/link";
import { listPublishedVideos, listSavedVideos, getPublishedVideo } from "@/lib/video/feed";
import { getDbUserId, getSession } from "@/lib/auth/session";
import { isStripeEnabled } from "@/lib/commerce/stripe";
import { FeedTheater } from "@/components/video/FeedTheater";
import { PlatformShell } from "@/components/layout/PlatformShell";

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
  const theaterVideos = [
    ...(focused ? [focused] : []),
    ...(tab === "following" ? videos.filter((video) => video.followedByMe) : videos),
  ];

  if (tab === "saved" && !viewerId) {
    return (
      <PlatformShell title="Play" flush>
        <div className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Guardados</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold">Entra para ver lo que guardaste</h1>
          <p className="mt-3 max-w-sm text-sm text-white/55">La estrella se queda en tu cuenta, no en el teléfono.</p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent("/play?tab=saved")}`}
            className="mt-6 rounded-full bg-klik-green px-6 py-3 text-sm font-bold text-klik-black"
          >
            Entrar
          </Link>
        </div>
      </PlatformShell>
    );
  }

  if (theaterVideos.length === 0 && tab === "foryou") {
    return (
      <PlatformShell title="Play" flush>
        <div className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Play</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold">El primer clip eres tú</h1>
          <p className="mt-3 max-w-sm text-sm text-white/55">
            Un video corto. Swipe. Sin vender, si no quieres. Estilo Douyin, en Qlyk.
          </p>
          <Link
            href="/publish?lane=play"
            className="mt-6 rounded-full bg-klik-green px-6 py-3 text-sm font-bold text-klik-black"
          >
            Subir clip
          </Link>
        </div>
      </PlatformShell>
    );
  }

  if (tab === "following" && theaterVideos.length === 0) {
    return (
      <PlatformShell title="Play" flush>
        <div className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Siguiendo</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold">Todavía no sigues a nadie</h1>
          <p className="mt-3 max-w-sm text-sm text-white/55">En Play, toca el + bajo el avatar. Quien sigas aparece aquí.</p>
          <Link href="/play" className="mt-6 rounded-full bg-klik-green px-6 py-3 text-sm font-bold text-klik-black">
            Ir a Play
          </Link>
        </div>
      </PlatformShell>
    );
  }

  if (tab === "saved" && theaterVideos.length === 0) {
    return (
      <PlatformShell title="Play" flush>
        <div className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Guardados</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold">Todavía no guardas nada</h1>
          <p className="mt-3 max-w-sm text-sm text-white/55">En un clip, toca la estrella. Aquí se queda.</p>
          <Link href="/play" className="mt-6 rounded-full bg-klik-green px-6 py-3 text-sm font-bold text-klik-black">
            Ir a Play
          </Link>
        </div>
      </PlatformShell>
    );
  }

  return (
    <FeedTheater
      home="play"
      feedTab={tab}
      videos={theaterVideos}
      initialId={searchParams.v}
      signedIn={Boolean(session?.user)}
      stripeEnabled={isStripeEnabled()}
      buySlug={searchParams.buy}
      canceled={searchParams.canceled === "1"}
    />
  );
}
