import { mockVideos } from "@/data/mock";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { PlatformShell } from "@/components/layout/PlatformShell";

export default function FeedPage() {
  return (
    <PlatformShell title="Feed" flush>
      <div className="h-[calc(100dvh-3.5rem)] snap-y snap-mandatory overflow-y-auto">
        {mockVideos.map((video) => (
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
    </PlatformShell>
  );
}
