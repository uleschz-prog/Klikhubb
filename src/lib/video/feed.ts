import { prisma } from "@/lib/prisma";
import { isConnectionError } from "@/lib/demo/store";
import { muxPlaybackUrl, videoGradient, type FeedVideo } from "@/lib/video/types";

export async function listPublishedVideos(limit = 40): Promise<FeedVideo[]> {
  try {
    const rows = await prisma.video.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: limit,
      include: {
        creator: { select: { displayName: true, username: true, name: true } },
        products: {
          where: { isPrimary: true },
          take: 1,
          include: { product: { select: { slug: true, title: true, price: true, currency: true, status: true } } },
        },
      },
    });

    return rows.map((row) => {
      const productRow = row.products[0]?.product;
      const playback = row.playbackId ? muxPlaybackUrl(row.playbackId) : null;
      return {
        id: row.id,
        creatorName: row.creator.displayName ?? row.creator.name ?? "Creador",
        handle: row.creator.username ?? "klik",
        caption: row.caption ?? row.title,
        title: row.title,
        videoUrl: row.videoUrl ?? playback,
        playbackId: row.playbackId,
        thumbnailUrl: row.thumbnailUrl,
        likes: row.likeCount,
        comments: row.commentCount,
        gradient: videoGradient(row.id),
        product:
          productRow && productRow.status === "ACTIVE"
            ? {
                slug: productRow.slug,
                title: productRow.title,
                price: Number(productRow.price),
                currency: productRow.currency.trim(),
              }
            : null,
      };
    });
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    return [];
  }
}
