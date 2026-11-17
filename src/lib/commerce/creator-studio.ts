import { prisma } from "@/lib/prisma";
import { shouldUseDemoFallback } from "@/lib/demo/store";
import {
  buildStudioOnboarding,
  type CreatorStudioView,
  type StudioProductCard,
  type StudioSale,
} from "@/lib/commerce/creator-studio-view";

export type { CreatorStudioView, StudioProductCard, StudioSale, StudioOnboarding, StudioRangeDays } from "@/lib/commerce/creator-studio-view";
export { STUDIO_RANGE_DAYS, filterStudioSales, summarizeStudioSales, buildStudioOnboarding, evolutionMilestone } from "@/lib/commerce/creator-studio-view";

export async function loadCreatorStudio(userId: string): Promise<CreatorStudioView> {
  try {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const [user, products, orders, wallet, videoCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, name: true, username: true, image: true },
      }),
      prisma.product.findMany({
        where: {
          creatorId: userId,
          type: { in: ["COURSE", "MEMBERSHIP", "DIGITAL"] },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          course: {
            select: { lessonCount: true, _count: { select: { modules: true } } },
          },
          videos: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 1,
            include: { video: { select: { thumbnailUrl: true } } },
          },
        },
      }),
      prisma.order.findMany({
        where: {
          sellerId: userId,
          status: "PAID",
          paidAt: { gte: since },
        },
        orderBy: { paidAt: "desc" },
        include: {
          items: { select: { productId: true, total: true } },
          commissions: {
            where: { beneficiaryId: userId, type: "CREATOR_SALE", status: { not: "CLAWED_BACK" } },
            select: { amount: true },
          },
        },
      }),
      prisma.wallet.findUnique({ where: { userId }, select: { lifetimeEarned: true } }),
      prisma.video.count({ where: { creatorId: userId, status: "PUBLISHED" } }),
    ]);

    const productCards: StudioProductCard[] = products.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      price: Number(row.price),
      currency: row.currency.trim(),
      status: row.status,
      type: row.type,
      lessonCount: row.course?.lessonCount ?? 0,
      moduleCount: row.course?._count.modules ?? 0,
      coverUrl: row.videos[0]?.video.thumbnailUrl ?? null,
      updatedAt: row.updatedAt.toISOString(),
    }));

    const sales: StudioSale[] = orders
      .filter((order) => order.paidAt)
      .map((order) => {
        const grossUsd = Number(order.total);
        const commissionNet = order.commissions.reduce((sum, row) => sum + Number(row.amount), 0);
        return {
          id: order.id,
          paidAt: order.paidAt!.toISOString(),
          productIds: order.items.map((item) => item.productId),
          netUsd: commissionNet > 0 ? commissionNet : grossUsd,
          grossUsd,
        };
      });

    const hasProduct = productCards.length > 0 || videoCount > 0;
    const shareable = productCards.find((product) => product.status === "ACTIVE") ?? null;
    const hasProfile = Boolean((user?.displayName || user?.name) && user?.image);
    const onboardingBase = buildStudioOnboarding({
      hasProfile,
      hasProduct,
      hasShareLink: Boolean(shareable),
      hasSale: sales.length > 0 || Number(wallet?.lifetimeEarned ?? 0) > 0,
    });

    return {
      displayName: user?.displayName ?? user?.name ?? "Creador",
      username: user?.username ?? null,
      imageUrl: user?.image ?? null,
      products: productCards,
      sales,
      lifetimeEarnedUsd: Number(wallet?.lifetimeEarned ?? 0),
      onboarding: { ...onboardingBase, shareSlug: shareable?.slug ?? null },
      videoCount,
    };
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return emptyStudioView();
  }
}

function emptyStudioView(): CreatorStudioView {
  return {
    displayName: "Creador",
    username: null,
    imageUrl: null,
    products: [],
    sales: [],
    lifetimeEarnedUsd: 0,
    onboarding: { ...buildStudioOnboarding({ hasProfile: false, hasProduct: false, hasShareLink: false, hasSale: false }), shareSlug: null },
    videoCount: 0,
  };
}
