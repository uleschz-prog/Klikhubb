/**
 * Elimina usuarios, productos y videos ficticios de desarrollo/prueba.
 * Uso: npm run db:purge-demo
 */
import { PrismaClient } from "@prisma/client";
import { DEMO_PRODUCT_SLUGS, DEMO_USER_EMAILS, DEMO_VIDEO_IDS } from "../src/config/demo-fixtures";
import { ensurePlatformAdmin } from "../src/lib/auth/ensure-admin";

const prisma = new PrismaClient();

async function main() {
  const admin = await ensurePlatformAdmin(prisma);

  const demoUsers = await prisma.user.findMany({
    where: { email: { in: [...DEMO_USER_EMAILS] } },
    select: { id: true, email: true },
  });
  const demoUserIds = demoUsers.map((user) => user.id);

  const demoProducts = await prisma.product.findMany({
    where: {
      OR: [
        { slug: { in: [...DEMO_PRODUCT_SLUGS] } },
        ...(demoUserIds.length ? [{ creatorId: { in: demoUserIds } }] : []),
      ],
    },
    select: { id: true, slug: true },
  });
  const demoProductIds = demoProducts.map((product) => product.id);

  const demoVideos = await prisma.video.findMany({
    where: {
      OR: [
        { id: { in: [...DEMO_VIDEO_IDS] } },
        ...(demoUserIds.length ? [{ creatorId: { in: demoUserIds } }] : []),
      ],
    },
    select: { id: true, title: true },
  });
  const demoVideoIds = demoVideos.map((video) => video.id);

  const demoOrders = demoUserIds.length
    ? await prisma.order.findMany({
        where: {
          OR: [
            { buyerId: { in: demoUserIds } },
            { sellerId: { in: demoUserIds } },
            { affiliateId: { in: demoUserIds } },
            ...(demoProductIds.length
              ? [{ items: { some: { productId: { in: demoProductIds } } } }]
              : []),
          ],
        },
        select: { id: true },
      })
    : [];
  const demoOrderIds = demoOrders.map((order) => order.id);

  console.log("Purgando datos ficticios…");
  console.log(`  Usuarios demo: ${demoUsers.length}`);
  console.log(`  Productos demo: ${demoProducts.length}`);
  console.log(`  Videos demo: ${demoVideos.length}`);
  console.log(`  Órdenes demo: ${demoOrderIds.length}`);

  if (!demoUserIds.length && !demoProductIds.length && !demoVideoIds.length) {
    console.log("Nada que purgar en la base de datos.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (demoVideoIds.length) {
      await tx.lesson.updateMany({ where: { videoId: { in: demoVideoIds } }, data: { videoId: null } });
      await tx.videoViewEvent.deleteMany({ where: { videoId: { in: demoVideoIds } } });
      await tx.videoLike.deleteMany({ where: { videoId: { in: demoVideoIds } } });
      await tx.videoSave.deleteMany({ where: { videoId: { in: demoVideoIds } } });
      await tx.videoComment.deleteMany({ where: { videoId: { in: demoVideoIds } } });
      await tx.videoTag.deleteMany({ where: { videoId: { in: demoVideoIds } } });
      await tx.videoProduct.deleteMany({ where: { videoId: { in: demoVideoIds } } });
      await tx.video.deleteMany({ where: { id: { in: demoVideoIds } } });
    }

    if (demoProductIds.length) {
      await tx.enrollment.deleteMany({ where: { productId: { in: demoProductIds } } });
      await tx.videoProduct.deleteMany({ where: { productId: { in: demoProductIds } } });
    }

    if (demoOrderIds.length) {
      await tx.walletLedger.deleteMany({ where: { orderId: { in: demoOrderIds } } });
      await tx.commission.deleteMany({ where: { orderId: { in: demoOrderIds } } });
      await tx.payment.deleteMany({ where: { orderId: { in: demoOrderIds } } });
      await tx.enrollment.deleteMany({ where: { orderId: { in: demoOrderIds } } });
      await tx.orderItem.deleteMany({ where: { orderId: { in: demoOrderIds } } });
      await tx.order.deleteMany({ where: { id: { in: demoOrderIds } } });
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
      await tx.enrollment.deleteMany({ where: { userId: { in: demoUserIds } } });
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
    }

    if (demoProductIds.length) {
      await tx.community.deleteMany({ where: { productId: { in: demoProductIds } } });
      await tx.lesson.deleteMany({ where: { module: { course: { productId: { in: demoProductIds } } } } });
      await tx.courseModule.deleteMany({ where: { course: { productId: { in: demoProductIds } } } });
      await tx.course.deleteMany({ where: { productId: { in: demoProductIds } } });
      await tx.orderItem.deleteMany({ where: { productId: { in: demoProductIds } } });
      await tx.product.deleteMany({ where: { id: { in: demoProductIds } } });
    }

    if (demoUserIds.length) {
      await tx.user.deleteMany({ where: { id: { in: demoUserIds } } });
    }
  });

  console.log("Purge OK — plataforma lista sin usuarios ni contenido ficticio.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
