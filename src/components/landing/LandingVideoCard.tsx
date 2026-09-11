"use client";

import Link from "next/link";
import type { FeedVideo } from "@/lib/video/types";
import { youtubePoster } from "@/lib/video/source";

export function LandingVideoCard({ video }: { video: FeedVideo }) {
  const poster = video.thumbnailUrl ?? youtubePoster(video.videoUrl ?? "") ?? null;
  const price =
    video.product != null
      ? new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: video.product.currency || "MXN",
          maximumFractionDigits: 0,
        }).format(video.product.price)
      : null;

  return (
    <Link
      href={video.product ? `/feed?v=${video.id}` : `/play?v=${video.id}`}
      className="group block overflow-hidden rounded-2xl border transition duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: "var(--l-border)",
        background: "var(--l-surface)",
        boxShadow: "var(--l-shadow)",
      }}
    >
      <div className="relative aspect-[4/5] overflow-hidden" style={{ background: "var(--l-muted-bg)" }}>
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${video.gradient}`} />
        )}
        {price ? (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
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
