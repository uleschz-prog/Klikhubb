import { prisma } from "@/lib/prisma";
import { shouldUseDemoFallback } from "@/lib/demo/store";
import { muxPlaybackUrl, posterFromVideoUrl, videoGradient, type FeedVideo } from "@/lib/video/types";

const videoInclude = {
  creator: { select: { id: true, displayName: true, username: true, name: true, image: true } },
  tags: { include: { tag: { select: { slug: true, name: true } } } },
  products: {
    where: { isPrimary: true },
    take: 1,
    include: {
      product: {
        select: { slug: true, title: true, description: true, type: true, price: true, currency: true, status: true },
      },
    },
  },
  _count: { select: { comments: true } },
} as const;

type FeedRow = Awaited<ReturnType<typeof prisma.video.findMany<{ include: typeof videoInclude }>>>[number];

function toFeedVideo(
  row: FeedRow,
  flags: { liked: boolean; saved: boolean; followed: boolean },
): FeedVideo {
  const productRow = row.products[0]?.product;
  const playback = row.playbackId ? muxPlaybackUrl(row.playbackId) : null;
  const tagged = row.tags.map((item) => item.tag.slug);
  const fallback = ["qlyk"];
  if (productRow) fallback.unshift(productRow.slug.replace(/-/g, ""));
  return {
    id: row.id,
    creatorId: row.creator.id,
    creatorName: row.creator.displayName ?? row.creator.name ?? "Creador",
    creatorImage: row.creator.image,
    handle: row.creator.username ?? "klik",
    likedByMe: flags.liked,
    savedByMe: flags.saved,
    followedByMe: flags.followed,
    caption: row.caption ?? row.title,
    title: row.title,
    videoUrl: row.videoUrl ?? playback,
    playbackId: row.playbackId,
    thumbnailUrl: row.thumbnailUrl ?? posterFromVideoUrl(row.videoUrl),
    durationMs: row.durationMs,
    likes: row.likeCount,
    comments: row._count.comments,
    shares: row.shareCount,
    favorites: row.saveCount,
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
    tags: tagged.length ? tagged : fallback,
    gradient: videoGradient(row.id),
    lane: row.lane,
    product:
      productRow && productRow.status === "ACTIVE"
        ? {
            slug: productRow.slug,
            title: productRow.title,
            price: Number(productRow.price),
            currency: productRow.currency.trim(),
            description: productRow.description,
            type: productRow.type,
          }
        : null,
  };
}

async function withViewerFlags(rows: FeedRow[], viewerId?: string) {
  const videoIds = rows.map((row) => row.id);
  const creatorIds = Array.from(new Set(rows.map((row) => row.creator.id)));
  const likedIds = new Set<string>();
  const savedIds = new Set<string>();
  const followedIds = new Set<string>();

  if (viewerId && videoIds.length) {
    const [likes, saves, follows] = await Promise.all([
      prisma.videoLike.findMany({
        where: { userId: viewerId, videoId: { in: videoIds } },
        select: { videoId: true },
      }),
      prisma.videoSave.findMany({
        where: { userId: viewerId, videoId: { in: videoIds } },
        select: { videoId: true },
      }),
      prisma.follow.findMany({
        where: { followerId: viewerId, followingId: { in: creatorIds } },
        select: { followingId: true },
      }),
    ]);
    likes.forEach((row) => likedIds.add(row.videoId));
    saves.forEach((row) => savedIds.add(row.videoId));
    follows.forEach((row) => followedIds.add(row.followingId));
  }

  return rows.map((row) =>
    toFeedVideo(row, {
      liked: likedIds.has(row.id),
      saved: savedIds.has(row.id),
      followed: followedIds.has(row.creator.id),
    }),
  );
}

export async function listPublishedVideos(
  limit = 40,
  viewerId?: string,
  lane?: "PLAY" | "SHOP",
): Promise<FeedVideo[]> {
  try {
    const rows = await prisma.video.findMany({
      where: { status: "PUBLISHED", ...(lane ? { lane } : {}) },
      orderBy: { publishedAt: "desc" },
      take: limit,
      include: videoInclude,
    });
    return withViewerFlags(rows, viewerId);
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return [];
  }
}

export async function getPublishedVideo(id: string, viewerId?: string): Promise<FeedVideo | null> {
  try {
    const row = await prisma.video.findFirst({
      where: { id, status: "PUBLISHED" },
      include: videoInclude,
    });
    if (!row) return null;
    const [flagged] = await withViewerFlags([row], viewerId);
    return flagged ?? null;
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return null;
  }
}

export async function listSavedVideos(
  limit = 40,
  viewerId: string,
  lane?: "PLAY" | "SHOP",
): Promise<FeedVideo[]> {
  try {
    const saves = await prisma.videoSave.findMany({
      where: {
        userId: viewerId,
        video: { status: "PUBLISHED", ...(lane ? { lane } : {}) },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { videoId: true },
    });
    const order = saves.map((row) => row.videoId);
    if (order.length === 0) return [];

    const rows = await prisma.video.findMany({
      where: { id: { in: order }, status: "PUBLISHED" },
      include: videoInclude,
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    const ordered = order
      .map((id) => byId.get(id))
      .filter((row): row is FeedRow => Boolean(row));
    return withViewerFlags(ordered, viewerId);
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return [];
  }
}
