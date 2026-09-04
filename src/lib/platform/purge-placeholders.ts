import { Prisma } from "@prisma/client";
import {
  DEMO_PRODUCT_SLUGS,
  DEMO_USER_EMAILS,
  DEMO_USERNAMES,
  DEMO_VIDEO_IDS,
  PLACEHOLDER_ASSET_MARKERS,
  PLACEHOLDER_BOOTSTRAP,
  PLACEHOLDER_CAPTION_MARKERS,
  PLACEHOLDER_FEED_TITLES,
  isPlaceholderMediaUrl,
} from "@/config/demo-fixtures";
import { prisma } from "@/lib/prisma";
import { ensurePlatformAdmin } from "@/lib/auth/ensure-admin";

export type PurgePlaceholderResult = {
  deletedVideos: number;
  archivedProducts: number;
  deletedDemoUsers: number;
  deletedDemoProducts: number;
  videoTitles: string[];
  productSlugs: string[];
};

async function deleteVideosByIds(tx: Prisma.TransactionClient, videoIds: string[]) {
  if (!videoIds.length) return;
  await tx.lesson.updateMany({ where: { videoId: { in: videoIds } }, data: { videoId: null } });
  await tx.videoViewEvent.deleteMany({ where: { videoId: { in: videoIds } } });
  await tx.videoLike.deleteMany({ where: { videoId: { in: videoIds } } });
  await tx.videoSave.deleteMany({ where: { videoId: { in: videoIds } } });
  await tx.videoComment.deleteMany({ where: { videoId: { in: videoIds } } });
  await tx.videoTag.deleteMany({ where: { videoId: { in: videoIds } } });
  await tx.videoProduct.deleteMany({ where: { videoId: { in: videoIds } } });
  await tx.video.deleteMany({ where: { id: { in: videoIds } } });
}

/** Videos de demo o bootstrap con asset placeholder (no contenido de creadores reales). */
export async function findPlaceholderVideos() {
  const assetOr = PLACEHOLDER_ASSET_MARKERS.flatMap((marker) => [
    { videoUrl: { contains: marker } },
    { thumbnailUrl: { contains: marker } },
  ]);

  const captionOr = PLACEHOLDER_CAPTION_MARKERS.map((marker) => ({
    caption: { contains: marker },
  }));

  return prisma.video.findMany({
    where: {
      OR: [
        { id: { in: [...DEMO_VIDEO_IDS] } },
        { title: { in: [...PLACEHOLDER_FEED_TITLES] } },
        ...assetOr,
        ...captionOr,
        {
          creator: {
            username: { in: [...DEMO_USERNAMES], mode: "insensitive" },
          },
        },
      ],
    },
    select: { id: true, title: true, status: true, lane: true, videoUrl: true },
  });
}

export async function purgePlaceholderFeedContent(): Promise<PurgePlaceholderResult> {
  const admin = await ensurePlatformAdmin();

  const placeholderVideos = await findPlaceholderVideos();
  const placeholderVideoIds = placeholderVideos.map((row) => row.id);

  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: [...DEMO_USER_EMAILS] } },
        { username: { in: [...DEMO_USERNAMES], mode: "insensitive" } },
      ],
    },
    select: { id: true, email: true },
  });
  const demoUserIds = demoUsers.map((user) => user.id);

  const demoProducts = await prisma.product.findMany({
    where: {
      OR: [
        { slug: { in: [...DEMO_PRODUCT_SLUGS] } },
        { slug: PLACEHOLDER_BOOTSTRAP.courseSlug },
        ...(demoUserIds.length ? [{ creatorId: { in: demoUserIds } }] : []),
      ],
    },
    select: { id: true, slug: true },
  });

  const demoVideosFromUsers = demoUserIds.length
    ? await prisma.video.findMany({
        where: { creatorId: { in: demoUserIds } },
        select: { id: true, title: true },
      })
    : [];

  const allVideoIds = Array.from(
    new Set([...placeholderVideoIds, ...demoVideosFromUsers.map((row) => row.id)]),
  );

  const demoProductIds = demoProducts.map((product) => product.id);

  const demoOrders =
    demoUserIds.length || demoProductIds.length
      ? await prisma.order.findMany({
          where: {
            OR: [
              ...(demoUserIds.length
                ? [
                    { buyerId: { in: demoUserIds } },
                    { sellerId: { in: demoUserIds } },
                    { affiliateId: { in: demoUserIds } },
                  ]
                : []),
              ...(demoProductIds.length
                ? [{ items: { some: { productId: { in: demoProductIds } } } }]
                : []),
            ],
          },
          select: { id: true },
        })
      : [];
  const demoOrderIds = demoOrders.map((order) => order.id);

  await prisma.$transaction(async (tx) => {
    await deleteVideosByIds(tx, allVideoIds);

    // Archiva curso bootstrap placeholder para que no aparezca en marketplace.
    await tx.product.updateMany({
      where: { slug: PLACEHOLDER_BOOTSTRAP.courseSlug },
      data: { status: "ARCHIVED" },
    });

    if (demoProductIds.length) {
      await tx.videoProduct.deleteMany({ where: { productId: { in: demoProductIds } } });
    }

    if (demoUserIds.length) {
      await tx.enrollment.deleteMany({ where: { userId: { in: demoUserIds } } });
    }

    if (demoOrderIds.length) {
      await tx.walletLedger.deleteMany({ where: { orderId: { in: demoOrderIds } } });
      await tx.commission.deleteMany({ where: { orderId: { in: demoOrderIds } } });
      await tx.payment.deleteMany({ where: { orderId: { in: demoOrderIds } } });
      await tx.enrollment.deleteMany({ where: { orderId: { in: demoOrderIds } } });
      await tx.orderItem.deleteMany({ where: { orderId: { in: demoOrderIds } } });
      await tx.order.deleteMany({ where: { id: { in: demoOrderIds } } });
    }

    const hardDeleteProductIds = demoProducts
      .filter((product) => (DEMO_PRODUCT_SLUGS as readonly string[]).includes(product.slug))
      .map((product) => product.id);

    if (hardDeleteProductIds.length) {
      await tx.community.deleteMany({ where: { productId: { in: hardDeleteProductIds } } });
      await tx.lesson.deleteMany({
        where: { module: { course: { productId: { in: hardDeleteProductIds } } } },
      });
      await tx.courseModule.deleteMany({
        where: { course: { productId: { in: hardDeleteProductIds } } },
      });
      await tx.course.deleteMany({ where: { productId: { in: hardDeleteProductIds } } });
      await tx.orderItem.deleteMany({ where: { productId: { in: hardDeleteProductIds } } });
      await tx.enrollment.deleteMany({ where: { productId: { in: hardDeleteProductIds } } });
      await tx.product.deleteMany({ where: { id: { in: hardDeleteProductIds } } });
    }

    if (demoUserIds.length) {
      await tx.videoViewEvent.deleteMany({ where: { viewerId: { in: demoUserIds } } });
      await tx.commission.deleteMany({
        where: {
          OR: [{ beneficiaryId: { in: demoUserIds } }, { sourceUserId: { in: demoUserIds } }],
        },
      });
      await tx.walletLedger.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.payout.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.communityPost.deleteMany({ where: { authorId: { in: demoUserIds } } });
      await tx.communityMember.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.community.deleteMany({ where: { ownerId: { in: demoUserIds } } });
      await tx.follow.deleteMany({
        where: {
          OR: [{ followerId: { in: demoUserIds } }, { followingId: { in: demoUserIds } }],
        },
      });
      await tx.pointLedger.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.userReward.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.userRankHistory.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.userStats.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.networkClosure.deleteMany({
        where: {
          OR: [
            { ancestor: { userId: { in: demoUserIds } } },
            { descendant: { userId: { in: demoUserIds } } },
          ],
        },
      });
      await tx.networkNode.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.session.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.account.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.userRole.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.wallet.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.user.updateMany({
        where: { invitedById: { in: demoUserIds } },
        data: { invitedById: admin.id },
      });
      await tx.user.deleteMany({ where: { id: { in: demoUserIds } } });
    }
  });

  return {
    deletedVideos: allVideoIds.length,
    archivedProducts: demoProducts.filter((p) => p.slug === PLACEHOLDER_BOOTSTRAP.courseSlug).length,
    deletedDemoUsers: demoUserIds.length,
    deletedDemoProducts: demoProducts.filter((p) =>
      (DEMO_PRODUCT_SLUGS as readonly string[]).includes(p.slug),
    ).length,
    videoTitles: [...placeholderVideos, ...demoVideosFromUsers].map((row) => row.title),
    productSlugs: demoProducts.map((row) => row.slug),
  };
}

export function isPlaceholderVideoUrl(url: string | null | undefined) {
  return isPlaceholderMediaUrl(url);
}
