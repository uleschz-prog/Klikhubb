import Link from "next/link";
import { listPublishedVideos } from "@/lib/video/feed";
import { getSession } from "@/lib/auth/session";
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
  const videos = await listPublishedVideos(40, session?.user?.id);

  if (videos.length === 0) {
    return (
      <PlatformShell title="Feed" flush>
        <div className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Feed</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold">El feed está vacío</h1>
          <p className="mt-3 max-w-sm text-sm text-white/55">Sé el primero. Un video corto. Tu cara. Tu idea.</p>
          <Link
            href="/publish"
            className="mt-6 rounded-full bg-klik-green px-6 py-3 text-sm font-bold text-klik-black"
          >
            Publicar
          </Link>
        </div>
      </PlatformShell>
    );
  }

  return (
    <FeedEntry
      videos={videos}
      clipId={searchParams.v}
      tab={searchParams.tab === "following" ? "following" : "foryou"}
      signedIn={Boolean(session?.user)}
      stripeEnabled={isStripeEnabled()}
      buySlug={searchParams.buy}
      canceled={searchParams.canceled === "1"}
    />
  );
}
