import Link from "next/link";
import { listPublishedVideos, listSavedVideos } from "@/lib/video/feed";
import { getDbUserId, getSession } from "@/lib/auth/session";
import { getCheckoutMethods } from "@/config/checkout-methods";
import { FeedEntry } from "@/components/explore/FeedEntry";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { resolveDisplayFxUsdMxn } from "@/lib/commerce/display-fx";
import { selectFeaturedCatalog } from "@/lib/video/catalog-trust";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: { v?: string; tab?: string; buy?: string; canceled?: string };
}) {
  const session = await getSession();
  const viewerId = await getDbUserId();
  const tab =
    searchParams.tab === "following" ? "following" : searchParams.tab === "saved" ? "saved" : "foryou";
  const rawVideos =
    tab === "saved" && viewerId
      ? await listSavedVideos(40, viewerId, "SHOP")
      : await listPublishedVideos(40, viewerId ?? undefined, "SHOP");
  const videos = tab === "foryou" && !searchParams.v ? selectFeaturedCatalog(rawVideos) : rawVideos;

  if (tab === "foryou" && videos.length === 0) {
    return (
      <PlatformShell title="Tienda" flush>
        <div className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Tienda · Próximamente</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold">Aún no hay ofertas en la Tienda</h1>
          <p className="mt-3 max-w-sm text-sm text-white/55">
            Aquí van a aparecer clips originales con un curso o producto. Publica el tuyo y sé de los primeros en vender.
          </p>
          <Link href="/publish" className="btn-primary mt-6 rounded-full px-6 py-3 text-sm font-bold">
            Publicar y vender
          </Link>
        </div>
      </PlatformShell>
    );
  }

  const methods = getCheckoutMethods();

  return (
    <FeedEntry
      videos={videos}
      clipId={searchParams.v}
      tab={tab}
      signedIn={Boolean(session?.user)}
      speiEnabled={methods.spei}
      buySlug={searchParams.buy}
      canceled={searchParams.canceled === "1"}
      fxRate={resolveDisplayFxUsdMxn()}
    />
  );
}
