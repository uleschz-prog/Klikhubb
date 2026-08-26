"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { youtubeEmbedSrc, youtubePoster, youtubeWatchUrl } from "@/lib/video/source";

type YouTubeStageProps = {
  url: string;
  playing: boolean;
  muted: boolean;
  className?: string;
  title?: string;
  onTime?: (seconds: number) => void;
  onDuration?: (seconds: number) => void;
  onEnded?: () => void;
};

function command(frame: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  frame?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
}

export function YouTubeStage({
  url,
  playing,
  muted,
  className,
  title = "YouTube",
  onTime,
  onDuration,
  onEnded,
}: YouTubeStageProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [blocked, setBlocked] = useState(false);
  const origin = typeof window === "undefined" ? undefined : window.location.origin;
  const embed = useMemo(
    () => youtubeEmbedSrc(url, { autoplay: true, muted: true, origin }),
    [origin, url],
  );
  const poster = youtubePoster(url);
  const watchUrl = youtubeWatchUrl(url);

  useEffect(() => {
    command(frame.current, playing ? "playVideo" : "pauseVideo");
  }, [playing, url]);

  useEffect(() => {
    command(frame.current, muted ? "mute" : "unMute");
  }, [muted, url]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (typeof event.origin !== "string" || !event.origin.includes("youtube.com")) return;
      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload) as unknown;
        } catch {
          return;
        }
      }
      if (!payload || typeof payload !== "object") return;
      const data = payload as { event?: string; info?: { currentTime?: number; duration?: number; playerState?: number }; data?: number };
      if (data.event === "onError" || data.event === "error") {
        setBlocked(true);
        return;
      }
      if (typeof data.data === "number" && data.event === "onError") {
        setBlocked(true);
        return;
      }
      const info = data.info;
      if (!info) return;
      if (typeof info.currentTime === "number") onTime?.(info.currentTime);
      if (typeof info.duration === "number" && Number.isFinite(info.duration)) onDuration?.(info.duration);
      if (info.playerState === 0) onEnded?.();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onDuration, onEnded, onTime]);

  if (!embed) return null;

  if (blocked) {
    return (
      <div className={className}>
        {poster ? <img src={poster} alt="" className="h-full w-full object-cover" /> : null}
        {watchUrl ? (
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-5 py-2 text-sm font-bold text-black"
          >
            Ver en YouTube
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <iframe
      ref={frame}
      className={`${className ?? ""} pointer-events-none border-0`}
      src={embed}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      onLoad={() => {
        frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*");
        command(frame.current, playing ? "playVideo" : "pauseVideo");
        command(frame.current, muted ? "mute" : "unMute");
      }}
    />
  );
}
