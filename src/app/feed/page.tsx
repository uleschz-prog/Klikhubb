import Link from "next/link";
import { listPublishedVideos } from "@/lib/video/feed";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { PlatformShell } from "@/components/layout/PlatformShell";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const videos = await listPublishedVideos();

  return (
    <PlatformShell title="Feed" flush>
      {videos.length === 0 ? (
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
      ) : (
        <div className="h-[calc(100dvh-3.5rem)] snap-y snap-mandatory overflow-y-auto">
          {videos.map((video) => (
            <section
              key={video.id}
              className="flex h-[calc(100dvh-3.5rem)] snap-start items-center justify-center bg-klik-black"
            >
              <div className="relative h-full w-full max-w-[430px] overflow-hidden md:h-[min(100%,760px)] md:rounded-[1.75rem] md:border md:border-white/10">
                <VideoPlayer video={video} />
              </div>
            </section>
          ))}
        </div>
      )}
    </PlatformShell>
  );
}
