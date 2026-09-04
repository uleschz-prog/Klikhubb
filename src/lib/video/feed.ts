import {
  DEMO_USERNAMES,
  DEMO_VIDEO_IDS,
  PLACEHOLDER_ASSET_MARKERS,
  PLACEHOLDER_FEED_TITLES,
  isPlaceholderMediaUrl,
} from "@/config/demo-fixtures";
import { prisma } from "@/lib/prisma";
import { shouldUseDemoFallback } from "@/lib/demo/store";
import { muxPlaybackUrl, posterFromVideoUrl, videoGradient, type FeedVideo } from "@/lib/video/types";

function placeholderFeedExclude() {
  const assetNot = PLACEHOLDER_ASSET_MARKERS.flatMap((marker) => [
    {
      OR: [{ videoUrl: null }, { NOT: { videoUrl: { contains: marker } } }],
    },
    {
      OR: [{ thumbnailUrl: null }, { NOT: { thumbnailUrl: { contains: marker } } }],
    },
  ]);

  return {
    AND: [
      { NOT: { id: { in: [...DEMO_VIDEO_IDS] } } },
      { NOT: { title: { in: [...PLACEHOLDER_FEED_TITLES] } } },
      {
        NOT: {
          creator: {
            username: { in: [...DEMO_USERNAMES], mode: "insensitive" as const },
          },
        },
      },
      ...assetNot,
    ],
  };
}

const videoInclude = {
  creator: { select: { id: true, displayName: true, username: true, name: true, image: true } },
  tags: { include: { tag: { select: { slug: true, name: true } } } },
  products: {
    where: { isPrimary: true },
    take: 1,
    include: {
      product: {
        select: { slug: true, title: true, description: true, type: true, price: true, currency: true, status: true, billing: true },
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
            billing: productRow.billing,
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
      where: {
        status: "PUBLISHED",
        ...(lane ? { lane } : {}),
        ...placeholderFeedExclude(),
      },
      orderBy: { publishedAt: "desc" },
      take: Math.min(limit * 3, 120),
      include: videoInclude,
    });

    // Capa extra por si algún caption/título placeholder escapa del where de Prisma.
    const cleaned = rows.filter(
      (row) =>
        !isPlaceholderMediaUrl(row.videoUrl) &&
        !isPlaceholderMediaUrl(row.thumbnailUrl) &&
        !(PLACEHOLDER_FEED_TITLES as readonly string[]).includes(row.title),
    );

    let ordered = cleaned;
    if (viewerId && cleaned.length > 1) {
      const following = await prisma.follow.findMany({
        where: { followerId: viewerId },
        select: { followingId: true },
      });
      const followingIds = new Set(following.map((row) => row.followingId));
      const { rankFeed } = await import("@/lib/feed/recommendations");
      const ranked = rankFeed(
        cleaned.map((row) => ({
          id: row.id,
          creatorId: row.creator.id,
          publishedAt: row.publishedAt ?? row.createdAt,
          viewCount: row.viewCount,
          likeCount: row.likeCount,
          commentCount: row._count.comments,
          shareCount: row.shareCount,
          hasProduct: row.products.length > 0,
        })),
        { followingIds, downlineCreatorIds: new Set() },
      );
      const byId = new Map(cleaned.map((row) => [row.id, row]));
      ordered = ranked.map((item) => byId.get(item.id)!).filter(Boolean).slice(0, limit);
    } else {
      ordered = cleaned.slice(0, limit);
    }

    return withViewerFlags(ordered, viewerId);
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return [];
  }
}

export async function getPublishedVideo(id: string, viewerId?: string): Promise<FeedVideo | null> {
  try {
    if ((DEMO_VIDEO_IDS as readonly string[]).includes(id)) return null;
    const row = await prisma.video.findFirst({
      where: { id, status: "PUBLISHED", ...placeholderFeedExclude() },
      include: videoInclude,
    });
    if (!row) return null;
    if (isPlaceholderMediaUrl(row.videoUrl) || isPlaceholderMediaUrl(row.thumbnailUrl)) return null;
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
