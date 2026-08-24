export type VideoCandidate = {
  id: string;
  creatorId: string;
  publishedAt: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  hasProduct: boolean;
};

export type ViewerContext = {
  followingIds: Set<string>;
  downlineCreatorIds: Set<string>;
  now?: Date;
};

/**
 * Ranking del feed: recencia + engagement + proximidad de red + CTA de producto.
 * Pensado como primer corte antes de un modelo ML (two-tower / ranking).
 */
export function scoreVideo(video: VideoCandidate, ctx: ViewerContext): number {
  const now = ctx.now ?? new Date();
  const ageHours = Math.max(0, (now.getTime() - video.publishedAt.getTime()) / 3_600_000);
  const recency = Math.exp(-ageHours / 48);

  const engagement =
    (video.likeCount + video.commentCount * 2 + video.shareCount * 3) /
    Math.max(video.viewCount, 1);

  const network = ctx.followingIds.has(video.creatorId)
    ? 1
    : ctx.downlineCreatorIds.has(video.creatorId)
      ? 0.55
      : 0;

  const productBoost = video.hasProduct ? 1 : 0;

  return recency * 0.35 + Math.min(engagement * 8, 1) * 0.3 + network * 0.2 + productBoost * 0.15;
}

export function rankFeed(videos: VideoCandidate[], ctx: ViewerContext): VideoCandidate[] {
  return [...videos].sort((a, b) => scoreVideo(b, ctx) - scoreVideo(a, ctx));
}
