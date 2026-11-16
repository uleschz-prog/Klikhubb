"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { FeedVideo } from "@/lib/video/types";
import {
  isHoverPlayableVideoUrl,
  muxPlaybackIdFromUrl,
  muxPreviewMp4Url,
  muxThumbnailUrl,
} from "@/lib/video/types";
import { youtubePoster } from "@/lib/video/source";
import { PriceTag } from "@/components/ui/PriceTag";
import { RemoteImage } from "@/components/ui/RemoteImage";

function landingPoster(video: FeedVideo) {
  if (video.thumbnailUrl) return video.thumbnailUrl;
  const url = video.videoUrl ?? "";
  const youtube = youtubePoster(url);
  if (youtube) return youtube;
  const muxId = video.playbackId ?? muxPlaybackIdFromUrl(url);
  if (muxId) return muxThumbnailUrl(muxId);
  return null;
}

function landingPreviewSrc(video: FeedVideo) {
  const muxId = video.playbackId ?? (video.videoUrl ? muxPlaybackIdFromUrl(video.videoUrl) : null);
  if (muxId) return muxPreviewMp4Url(muxId);
  const url = video.videoUrl;
  if (!url || !isHoverPlayableVideoUrl(url)) return null;
  return url;
}

export function LandingVideoCard({ video, fxRate }: { video: FeedVideo; fxRate?: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const poster = landingPoster(video);
  const previewSrc = previewFailed ? null : landingPreviewSrc(video);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !previewSrc) return;
    if (hovered) {
      node.muted = true;
      node.currentTime = 0;
      void node.play().catch(() => undefined);
      return;
    }
    node.pause();
    if (node.readyState >= 1) node.currentTime = 0;
  }, [hovered, previewSrc]);

  return (
    <Link
      href={video.product ? `/feed?v=${video.id}` : `/play?v=${video.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border transition duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: "var(--l-border)",
        background: "var(--l-surface)",
        boxShadow: "var(--l-shadow)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden" style={{ background: "var(--l-muted-bg)" }}>
        {previewSrc ? (
          <video
            ref={videoRef}
            src={previewSrc}
            poster={poster ?? undefined}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-contain object-center"
            aria-hidden
            onError={() => setPreviewFailed(true)}
          />
        ) : poster ? (
          <RemoteImage
            src={poster}
            alt={video.title || video.caption || "Video"}
            className="object-contain object-center"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${video.gradient}`} />
        )}
        {video.product ? (
          <span
            className="pointer-events-none absolute left-3 top-3 z-10 rounded-2xl px-2.5 py-1.5 text-klik-black"
            style={{ background: "var(--l-accent)" }}
          >
            <PriceTag
              amount={video.product.price}
              currency={video.product.currency}
              fx={fxRate}
              size="sm"
              compact
            />
          </span>
        ) : null}
      </div>
      <div className="mt-auto space-y-1 px-3.5 py-3.5">
        <p className="line-clamp-2 min-h-[2.5rem] text-[15px] font-semibold leading-snug tracking-tight" style={{ color: "var(--l-fg)" }}>
          {video.title || video.caption || "Video"}
        </p>
        <p className="truncate text-[13px]" style={{ color: "var(--l-muted)" }}>
          @{video.handle}
        </p>
      </div>
    </Link>
  );
}
