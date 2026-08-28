const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function normalizeVideoUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com|music\.youtube\.com)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function youtubeVideoId(raw: string): string | null {
  const href = normalizeVideoUrl(raw);
  if (!href) return null;
  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(href) ? href : `https://${href}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const youtubeHost =
    host === "youtu.be" ||
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com";
  if (!youtubeHost) return null;

  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    return YOUTUBE_ID.test(id) ? id : null;
  }

  const fromQuery = parsed.searchParams.get("v");
  if (fromQuery && YOUTUBE_ID.test(fromQuery)) return fromQuery;

  const parts = parsed.pathname.split("/").filter(Boolean);
  const maybe = parts[1];
  if (maybe && ["embed", "shorts", "live", "v", "watch"].includes(parts[0] ?? "") && YOUTUBE_ID.test(maybe)) {
    return maybe;
  }
  return null;
}

export function youtubeStartSeconds(raw: string): number | null {
  let parsed: URL;
  try {
    parsed = new URL(normalizeVideoUrl(raw));
  } catch {
    return null;
  }
  const value = parsed.searchParams.get("t") ?? parsed.searchParams.get("start");
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!match || !match[0]) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

export function youtubeWatchUrl(raw: string) {
  const id = youtubeVideoId(raw);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

export function youtubePoster(raw: string) {
  const id = youtubeVideoId(raw);
  return id ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` : null;
}

export function youtubeEmbedSrc(
  raw: string,
  options?: { autoplay?: boolean; muted?: boolean; origin?: string },
) {
  const id = youtubeVideoId(raw);
  if (!id) return null;
  const params = new URLSearchParams({
    autoplay: options?.autoplay === false ? "0" : "1",
    mute: options?.muted === false ? "0" : "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    controls: "0",
    iv_load_policy: "3",
    loop: "1",
    playlist: id,
    enablejsapi: "1",
    /** Mejor calidad en móvil / PWA — la calidad final la fija la API setPlaybackQuality */
    vq: "hd720",
  });
  const start = youtubeStartSeconds(raw);
  if (start) params.set("start", String(start));
  if (options?.origin) params.set("origin", options.origin);
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

/** Embed with controls for Academy — not the muted loop used in the feed. */
export function youtubeLessonEmbedSrc(raw: string) {
  const id = youtubeVideoId(raw);
  if (!id) return null;
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    controls: "1",
  });
  const start = youtubeStartSeconds(raw);
  if (start) params.set("start", String(start));
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function isAllowedVideoUrl(url: string) {
  const value = normalizeVideoUrl(url);
  if (youtubeVideoId(value)) return true;
  if (/^\/videos\/[A-Za-z0-9._-]+\.(mp4|webm|mov)$/i.test(value)) return true;
  return /^https:\/\//i.test(value);
}
