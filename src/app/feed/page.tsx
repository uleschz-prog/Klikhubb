import Link from "next/link";
import { listPublishedVideos, listSavedVideos } from "@/lib/video/feed";
import { getDbUserId, getSession } from "@/lib/auth/session";
import { isStripeEnabled } from "@/lib/commerce/stripe";
import { FeedEntry } from "@/components/explore/FeedEntry";
import { PlatformShell } from "@/components/layout/PlatformShell";

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
  const videos =
    tab === "saved" && viewerId
      ? await listSavedVideos(40, viewerId, "SHOP")
      : await listPublishedVideos(40, viewerId ?? undefined, "SHOP");

  if (tab === "foryou" && videos.length === 0) {
    return (
      <PlatformShell title="Feed" flush>
        <div className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Feed</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold">El feed está vacío</h1>
          <p className="mt-3 max-w-sm text-sm text-white/55">Sé el primero en vender desde el feed. Un clip con oferta.</p>
          <Link
            href="/publish"
            className="mt-6 rounded-full bg-klik-green px-6 py-3 text-sm font-bold text-klik-black"
          >
            Publicar y vender
          </Link>
        </div>
      </PlatformShell>
    );
  }

  return (
    <FeedEntry
      videos={videos}
      clipId={searchParams.v}
      tab={tab}
      signedIn={Boolean(session?.user)}
      stripeEnabled={isStripeEnabled()}
      buySlug={searchParams.buy}
      canceled={searchParams.canceled === "1"}
    />
  );
}
