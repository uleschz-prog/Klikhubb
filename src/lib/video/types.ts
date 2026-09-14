import { youtubePoster } from "@/lib/video/source";

export type FeedProduct = {
  slug: string;
  title: string;
  price: number;
  currency: string;
  description: string | null;
  type: string | null;
  billing: "ONE_TIME";
  owned?: boolean;
};

export type FeedVideo = {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorImage?: string | null;
  handle: string;
  likedByMe?: boolean;
  savedByMe?: boolean;
  followedByMe?: boolean;
  caption: string;
  title: string;
  videoUrl: string | null;
  playbackId: string | null;
  thumbnailUrl: string | null;
  durationMs: number | null;
  likes: number;
  comments: number;
  shares: number;
  favorites: number;
  publishedAt: string | null;
  tags: string[];
  gradient: string;
  lane: "PLAY" | "SHOP";
  product: FeedProduct | null;
};

const GRADIENTS = [
  "from-emerald-950 via-neutral-950 to-cyan-950",
  "from-cyan-950 via-neutral-950 to-neutral-900",
  "from-neutral-900 via-emerald-950 to-black",
];

export function videoGradient(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) {
    sum += id.charCodeAt(i);
  }
  return GRADIENTS[sum % GRADIENTS.length];
}

export function muxPlaybackUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function muxThumbnailUrl(playbackId: string) {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1&width=720`;
}

export function muxPreviewMp4Url(playbackId: string) {
  return `https://stream.mux.com/${playbackId}/low.mp4`;
}

export function muxPlaybackIdFromUrl(url: string) {
  const match = url.match(/stream\.mux\.com\/([A-Za-z0-9]+)/);
  return match?.[1] ?? null;
}

export function isHoverPlayableVideoUrl(url: string) {
  if (!url || youtubePoster(url)) return false;
  if (/\.m3u8(\?|$)/i.test(url)) return false;
  return true;
}

export function posterFromVideoUrl(videoUrl: string | null): string | null {
  if (!videoUrl) return null;
  const youtube = youtubePoster(videoUrl);
  if (youtube) return youtube;
  const muxId = muxPlaybackIdFromUrl(videoUrl);
  if (muxId) return muxThumbnailUrl(muxId);
  if (!videoUrl.startsWith("/") || !videoUrl.endsWith(".mp4")) return null;
  return `${videoUrl.slice(0, -4)}.jpg`;
}

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}
