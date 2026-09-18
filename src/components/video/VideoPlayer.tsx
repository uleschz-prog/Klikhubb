"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { FeedVideo } from "@/lib/video/types";
import { BuyButton } from "@/components/commerce/BuyButton";
import { YouTubeStage } from "@/components/video/YouTubeStage";
import { youtubeVideoId } from "@/lib/video/source";

type VideoPlayerProps = {
  video: FeedVideo;
  variant?: "full" | "preview";
};

function formatCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export function VideoPlayer({ video, variant = "full" }: VideoPlayerProps) {
  const preview = variant === "preview";
  const media = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const src = video.videoUrl;
  const fromYouTube = Boolean(src && youtubeVideoId(src));

  function toggleMute() {
    const node = media.current;
    if (!node) return;
    node.muted = !node.muted;
    setMuted(node.muted);
    if (!node.paused) return;
    void node.play().catch(() => undefined);
  }

  return (
    <article
      className={`theme-media relative isolate overflow-hidden bg-black ${
        preview ? "h-full w-full rounded-[1.6rem]" : "h-full min-h-full w-full"
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${video.gradient}`} />
      {src && fromYouTube ? (
        <YouTubeStage url={src} playing muted className="absolute inset-0 h-full w-full" title={video.title} />
      ) : src ? (
        <video
          ref={media}
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          poster={video.thumbnailUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => {
            void media.current?.play().catch(() => undefined);
          }}
          onClick={toggleMute}
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.12),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(0,255,65,0.08),transparent_40%)]" />
      <div className="scanlines pointer-events-none absolute inset-0 opacity-30" />

      {src ? (
        <button
          type="button"
          onClick={toggleMute}
          className="overlay-chip overlay-label absolute right-3 top-3 z-20 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
        >
          {muted ? "Toca para audio" : "Audio"}
        </button>
      ) : null}

      <div className="overlay-vignette-right pointer-events-none absolute inset-y-0 right-0 z-10 w-24" />
      <div className="overlay-vignette-bottom pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40" />
      <div
        className={`absolute inset-x-0 bottom-0 z-10 ${
          preview ? "p-4 pb-5" : "p-5 pb-24 md:pb-8"
        }`}
      >
        <div className="overlay-caption-plate rounded-2xl px-4 py-3">
        <p className="overlay-label font-display text-sm font-bold">
          @{video.handle}
          <span className="ml-2 font-sans text-xs font-medium opacity-80">{video.creatorName}</span>
        </p>
        <p className={`overlay-label mt-2 max-w-[85%] ${preview ? "text-xs leading-5" : "text-sm leading-6"}`}>
          {video.caption}
        </p>
        {video.product ? (
          <div className={preview ? "mt-3" : "mt-4 max-w-sm"}>
            {video.product.owned ? (
              <Link
                href={`/learn/${video.product.slug}`}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-klik-cyan px-5 py-3 text-sm font-bold text-klik-black"
              >
                Continuar
              </Link>
            ) : (
              <BuyButton
                price={video.product.price}
                currency={video.product.currency}
                label={preview ? "Comprar" : `Llevar ${video.product.title}`}
                href={`/checkout/${video.product.slug}`}
              />
            )}
          </div>
        ) : null}
        </div>
      </div>

      <aside
        className={`absolute right-3 z-10 flex flex-col items-center gap-4 text-white ${
          preview ? "bottom-28" : "bottom-36 md:bottom-24"
        }`}
      >
        <Action label={formatCount(video.likes)}>
          <HeartIcon />
        </Action>
        <Action label={formatCount(video.comments)}>
          <CommentIcon />
        </Action>
        <Action label="Share">
          <ShareIcon />
        </Action>
      </aside>
    </article>
  );
}

function Action({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="overlay-chip overlay-icon flex h-11 w-11 items-center justify-center rounded-full text-klik-cyan">
        {children}
      </span>
      <span className="overlay-label overlay-meta text-[10px] font-semibold tracking-wide">{label}</span>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-klik-green" aria-hidden>
      <path d="M12 21s-7.2-4.35-9.3-8.4C1.2 9.6 2.7 6 6.3 6c2.04 0 3.3 1.2 3.7 2.1C10.4 7.2 11.66 6 13.7 6c3.6 0 5.1 3.6 3.6 6.6C19.2 16.65 12 21 12 21z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden>
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-4 3.5V6.5z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden>
      <path d="M12 4v10M8 8l4-4 4 4M6 14v4.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V14" />
    </svg>
  );
}
