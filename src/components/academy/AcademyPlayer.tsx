"use client";

import { youtubeLessonEmbedSrc, youtubeVideoId } from "@/lib/video/source";

export function AcademyPlayer({
  title,
  videoUrl,
  thumbnailUrl,
  content,
  resourceUrl,
  resourceName,
}: {
  title: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  content?: string | null;
  resourceUrl?: string | null;
  resourceName?: string | null;
}) {
  const embed = videoUrl ? youtubeLessonEmbedSrc(videoUrl) : null;
  const file = Boolean(videoUrl && !youtubeVideoId(videoUrl));
  const hasMedia = Boolean(embed || (file && videoUrl));

  return (
    <div className="space-y-4">
      {embed ? (
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
      ) : null}

      {file && videoUrl ? (
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
      ) : null}

      {!hasMedia && !content && !resourceUrl ? (
        <div className="flex aspect-video items-center justify-center rounded-2xl border border-klik-line bg-klik-card px-6 text-center text-sm text-white/50">
          Esta lección todavía no tiene contenido.
        </div>
      ) : null}

      {content ? (
        <div className="rounded-2xl border border-klik-line bg-klik-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Notas</p>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/80">{content}</div>
        </div>
      ) : null}

      {resourceUrl ? (
        <a
          href={resourceUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-3 rounded-2xl border border-klik-cyan/30 bg-klik-cyan/10 px-5 py-4 text-sm font-semibold text-klik-cyan transition hover:bg-klik-cyan/15"
        >
          <span>Descargar {resourceName || "archivo"}</span>
          <span aria-hidden>↓</span>
        </a>
      ) : null}
    </div>
  );
}
