export type FeedProduct = {
  slug: string;
  title: string;
  price: number;
  currency: string;
};

export type FeedVideo = {
  id: string;
  creatorName: string;
  handle: string;
  caption: string;
  title: string;
  videoUrl: string | null;
  playbackId: string | null;
  thumbnailUrl: string | null;
  likes: number;
  comments: number;
  gradient: string;
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

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}
