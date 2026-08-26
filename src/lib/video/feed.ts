import { prisma } from "@/lib/prisma";
import { isConnectionError } from "@/lib/demo/store";
import { muxPlaybackUrl, posterFromVideoUrl, videoGradient, type FeedVideo } from "@/lib/video/types";

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
      include: {
        creator: { select: { id: true, displayName: true, username: true, name: true } },
        tags: { include: { tag: { select: { slug: true, name: true } } } },
        products: {
          where: { isPrimary: true },
          take: 1,
          include: { product: { select: { slug: true, title: true, description: true, type: true, price: true, currency: true, status: true } } },
        },
        _count: { select: { comments: true } },
      },
    });

    const videoIds = rows.map((row) => row.id);
    const creatorIds = Array.from(new Set(rows.map((row) => row.creator.id)));
    const likedIds = new Set<string>();
    const followedIds = new Set<string>();

    if (viewerId && videoIds.length) {
      const [likes, follows] = await Promise.all([
        prisma.videoLike.findMany({
          where: { userId: viewerId, videoId: { in: videoIds } },
          select: { videoId: true },
        }),
        prisma.follow.findMany({
          where: { followerId: viewerId, followingId: { in: creatorIds } },
          select: { followingId: true },
        }),
      ]);
      likes.forEach((row) => likedIds.add(row.videoId));
      follows.forEach((row) => followedIds.add(row.followingId));
    }

    return rows.map((row) => {
      const productRow = row.products[0]?.product;
      const playback = row.playbackId ? muxPlaybackUrl(row.playbackId) : null;
      return {
        id: row.id,
        creatorId: row.creator.id,
        creatorName: row.creator.displayName ?? row.creator.name ?? "Creador",
        handle: row.creator.username ?? "klik",
        likedByMe: likedIds.has(row.id),
        followedByMe: followedIds.has(row.creator.id),
        caption: row.caption ?? row.title,
        title: row.title,
        videoUrl: row.videoUrl ?? playback,
        playbackId: row.playbackId,
        thumbnailUrl: row.thumbnailUrl ?? posterFromVideoUrl(row.videoUrl),
        durationMs: row.durationMs,
        likes: row.likeCount,
        comments: row._count.comments,
        shares: row.shareCount,
        favorites: 0,
        publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
        tags: (() => {
          const tagged = row.tags.map((item) => item.tag.slug);
          if (tagged.length) return tagged;
          const fallback = ["qlyk"];
          if (productRow) fallback.unshift(productRow.slug.replace(/-/g, ""));
          return fallback;
        })(),
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
    });
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    return [];
  }
}
