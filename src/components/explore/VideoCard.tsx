"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FeedVideo } from "@/lib/video/types";
import { formatCount, formatFeedDate, formatTimecode } from "@/lib/video/format";

export function VideoCard({ video }: { video: FeedVideo }) {
  const router = useRouter();
  const media = useRef<HTMLVideoElement>(null);
  const [hover, setHover] = useState(false);
  const poster = video.thumbnailUrl ?? undefined;

  useEffect(() => {
    if (!hover) return;
    const node = media.current;
    if (!node) return;
    node.currentTime = 0;
    void node.play().catch(() => undefined);
  }, [hover]);

  return (
    <Link
      href={`/feed?v=${video.id}`}
      className="group block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <article className="overflow-hidden rounded-xl">
        <div className={`relative aspect-[3/4] overflow-hidden bg-gradient-to-br ${video.gradient}`}>
          {poster ? (
            <img
              src={poster}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition duration-300 ${
                hover && video.videoUrl ? "opacity-0" : "opacity-100"
              }`}
            />
          ) : null}
          {hover && video.videoUrl ? (
            <video
              ref={media}
              className="absolute inset-0 h-full w-full object-cover"
              src={video.videoUrl}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden
            />
          ) : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/75 to-transparent p-2.5">
            <p className="flex items-center gap-1 text-xs font-medium text-white">
              <HeartMini />
              {formatCount(video.likes)}
            </p>
            {video.durationMs ? (
              <p className="rounded bg-black/55 px-1.5 py-0.5 font-mono text-[11px] text-white">
                {formatTimecode(video.durationMs / 1000)}
              </p>
            ) : null}
          </div>
          {video.product ? (
            <span
              className="absolute left-2 top-2 z-10 rounded-full bg-klik-green px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-klik-black"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                router.push(`/feed?v=${video.id}&buy=${video.product!.slug}`);
              }}
            >
              Comprar
            </span>
          ) : null}
        </div>
        <div className="px-0.5 pt-2.5">
          <p className="line-clamp-2 text-sm leading-5 text-white">
            {video.caption}{" "}
            {video.tags.map((tag) => (
              <span key={tag} className="text-klik-cyan">
                #{tag}{" "}
              </span>
            ))}
          </p>
          <div className="mt-1.5 flex items-center justify-between text-[12px] text-white/45">
            <span>
              @{video.handle}
              {video.publishedAt ? ` · ${formatFeedDate(video.publishedAt)}` : ""}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function HeartMini() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white" aria-hidden>
      <path d="M12 20.25S4.5 15.3 3.2 10.4C2.4 7.5 4.1 5 6.8 5c1.7 0 3.1 1 3.7 2.3C11.1 6 12.5 5 14.2 5c2.7 0 4.4 2.5 3.6 5.4C16.5 15.3 12 20.25 12 20.25z" />
    </svg>
  );
}
