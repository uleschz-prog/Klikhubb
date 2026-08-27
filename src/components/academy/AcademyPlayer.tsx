"use client";

import { youtubeLessonEmbedSrc, youtubeVideoId } from "@/lib/video/source";

export function AcademyPlayer({
  title,
  videoUrl,
  thumbnailUrl,
}: {
  title: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
}) {
  const embed = videoUrl ? youtubeLessonEmbedSrc(videoUrl) : null;
  const file = Boolean(videoUrl && !youtubeVideoId(videoUrl));

  if (embed) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-klik-line bg-black">
        <iframe
          className="absolute inset-0 h-full w-full border-0"
          src={embed}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  if (file && videoUrl) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-klik-line bg-black">
        <video
          className="absolute inset-0 h-full w-full bg-black"
          src={videoUrl}
          poster={thumbnailUrl ?? undefined}
          controls
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-video items-center justify-center rounded-2xl border border-klik-line bg-klik-card px-6 text-center text-sm text-white/50">
      Esta lección todavía no tiene video.
    </div>
  );
}
