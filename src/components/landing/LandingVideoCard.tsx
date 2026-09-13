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

export function LandingVideoCard({ video }: { video: FeedVideo }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const poster = landingPoster(video);
  const previewSrc = previewFailed ? null : landingPreviewSrc(video);
  const price =
    video.product != null
      ? new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: video.product.currency || "MXN",
          maximumFractionDigits: 0,
        }).format(video.product.price)
      : null;

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
      className="group block overflow-hidden rounded-2xl border transition duration-200 hover:-translate-y-0.5"
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
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden
            onError={() => setPreviewFailed(true)}
          />
        ) : poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${video.gradient}`} />
        )}
        {price ? (
          <span
            className="on-accent pointer-events-none absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
            style={{ background: "var(--l-accent)" }}
          >
            {price}
          </span>
        ) : null}
      </div>
      <div className="space-y-1 px-3.5 py-3.5">
        <p className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight" style={{ color: "var(--l-fg)" }}>
          {video.title || video.caption || "Video"}
        </p>
        <p className="truncate text-[13px]" style={{ color: "var(--l-muted)" }}>
          @{video.handle}
        </p>
      </div>
    </Link>
  );
}
