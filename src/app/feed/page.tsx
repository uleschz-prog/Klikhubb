import { listPublishedVideos, listSavedVideos } from "@/lib/video/feed";
import { getDbUserId, getSession } from "@/lib/auth/session";
import { getCheckoutMethods } from "@/config/checkout-methods";
import { FeedEntry } from "@/components/explore/FeedEntry";
import { FeedEmptyState } from "@/components/video/FeedEmptyState";
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
      <FeedEmptyState
        titleShell="Tienda"
        kicker="Tienda"
        title="Aún no hay ofertas en la Tienda"
        body="Aquí van a aparecer clips originales con un curso o producto. Publica el tuyo y sé de los primeros en vender."
        actionHref="/publish"
        actionLabel="Publicar y vender"
      />
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
