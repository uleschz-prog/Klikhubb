"use client";

import type { MockVideo } from "@/data/mock";
import { BuyButton } from "@/components/commerce/BuyButton";

type VideoPlayerProps = {
  video: MockVideo;
  variant?: "full" | "preview";
};

function formatCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export function VideoPlayer({ video, variant = "full" }: VideoPlayerProps) {
  const preview = variant === "preview";

  return (
    <article
      className={`relative isolate overflow-hidden bg-klik-black ${
        preview ? "h-full w-full rounded-[1.6rem]" : "h-full min-h-full w-full"
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${video.gradient}`} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.18),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(0,255,65,0.12),transparent_40%)]" />
      <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />

      <div
        className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/55 to-transparent ${
          preview ? "p-4 pb-5" : "p-5 pb-24 md:pb-8"
        }`}
      >
        <p className="font-display text-sm font-bold text-white">
          @{video.handle}
          <span className="ml-2 font-sans text-xs font-medium text-white/70">{video.creatorName}</span>
        </p>
        <p className={`mt-2 max-w-[85%] text-white/85 ${preview ? "text-xs leading-5" : "text-sm leading-6"}`}>
          {video.caption}
        </p>
        {video.product ? (
          <div className={preview ? "mt-3" : "mt-4 max-w-sm"}>
            <BuyButton
              price={video.product.price}
              currency={video.product.currency}
              label={preview ? "Comprar" : `Llevar ${video.product.title}`}
              href={`/checkout/${video.product.slug}`}
            />
          </div>
        ) : null}
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
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35 text-klik-cyan backdrop-blur">
        {children}
      </span>
      <span className="text-[10px] font-semibold tracking-wide text-white/80">{label}</span>
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
