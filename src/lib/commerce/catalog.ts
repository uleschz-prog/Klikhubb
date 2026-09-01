import { PLATFORM_ADMIN } from "@/config/platform-admin";
import { prisma } from "@/lib/prisma";
import { splitSaleCommissions } from "@/lib/commerce/split";
import { CommerceError } from "@/lib/commerce/settle-order";
import { releaseMatureCommissions } from "@/lib/commerce/wallet";
import {
  demoFindProductBySlug,
  demoHasEnrollment,
  demoHub,
  demoInviterId,
  demoListEnrollments,
  demoListProducts,
  demoPlatformUserId,
  isDemoFallbackAllowed,
  shouldUseDemoFallback,
  loadDemo,
} from "@/lib/demo/store";
import type { LeaderboardRow } from "@/components/gamification/Leaderboard";

export type CatalogProduct = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  creatorId: string;
  type: string;
  billing: "ONE_TIME";
};

export type ResolvedProduct = CatalogProduct & { source: "postgres" | "demo" };

export async function resolveProduct(slug: string): Promise<ResolvedProduct | null> {
  try {
    const row = await prisma.product.findUnique({ where: { slug } });
    if (row && row.status === "ACTIVE") {
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        price: Number(row.price),
        currency: row.currency.trim(),
        creatorId: row.creatorId,
        type: row.type,
        billing: "ONE_TIME",
        source: "postgres",
      };
    }
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
  }

  if (!isDemoFallbackAllowed()) return null;

  const demo = await demoFindProductBySlug(slug);
  if (!demo) return null;
  return {
    id: demo.id,
    slug: demo.slug,
    title: demo.title,
    description: null,
    price: demo.price,
    currency: demo.currency,
    creatorId: demo.creatorId,
    type: demo.type,
    billing: "ONE_TIME",
    source: "demo",
  };
}

export async function assertCanPurchase(buyerId: string, product: ResolvedProduct) {
  if (product.creatorId === buyerId) {
    throw new CommerceError("No puedes comprar tu propio producto.", "SELF_PURCHASE");
  }

  if (product.source === "demo") {
    if (await demoHasEnrollment(buyerId, product.id)) {
      throw new CommerceError("Ya tienes este producto.", "ALREADY_OWNED");
    }
    return;
  }

  try {
    const owned = await prisma.enrollment.findUnique({
      where: { userId_productId: { userId: buyerId, productId: product.id } },
    });
    if (owned?.status === "ACTIVE") {
      throw new CommerceError("Ya tienes este producto.", "ALREADY_OWNED");
    }
  } catch (error) {
    if (error instanceof CommerceError) throw error;
    if (!shouldUseDemoFallback(error)) throw error;
    if (await demoHasEnrollment(buyerId, product.id)) {
      throw new CommerceError("Ya tienes este producto.", "ALREADY_OWNED");
    }
  }
}

export async function listCatalogProducts(): Promise<CatalogProduct[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { price: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      price: Number(row.price),
      currency: row.currency.trim(),
      creatorId: row.creatorId,
      type: row.type,
      billing: "ONE_TIME" as const,
    }));
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    const demo = await demoListProducts();
    return demo.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: null,
      price: row.price,
      currency: row.currency,
      creatorId: row.creatorId,
      type: row.type,
      billing: "ONE_TIME" as const,
    }));
  }
}

export type AcademyEnrollment = {
  slug: string;
  title: string;
  description: string | null;
  type: string;
  enrolledAt: string;
  role: "student" | "creator";
  lessonCount: number;
  progressPct: number;
};

export async function listMyAcademy(userId: string): Promise<AcademyEnrollment[]> {
  try {
    const [rows, owned] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              slug: true,
              title: true,
              description: true,
              type: true,
              course: { select: { lessonCount: true } },
              _count: { select: { videos: true } },
            },
          },
        },
      }),
      prisma.product.findMany({
        where: {
          creatorId: userId,
          status: "ACTIVE",
          type: { in: ["COURSE", "MEMBERSHIP", "DIGITAL"] },
        },
        orderBy: { createdAt: "desc" },
        include: { course: { select: { lessonCount: true } }, _count: { select: { videos: true } } },
      }),
    ]);

    const enrolled: AcademyEnrollment[] = rows.map((row) => ({
      slug: row.product.slug,
      title: row.product.title,
      description: row.product.description,
      type: row.product.type,
      enrolledAt: row.createdAt.toISOString(),
      role: "student" as const,
      lessonCount: row.product.course?.lessonCount || row.product._count.videos,
      progressPct: Number(row.progressPct),
    }));

    const enrolledSlugs = new Set(enrolled.map((row) => row.slug));
    for (const product of owned) {
      if (enrolledSlugs.has(product.slug)) continue;
      enrolled.push({
        slug: product.slug,
        title: product.title,
        description: product.description,
        type: product.type,
        enrolledAt: product.createdAt.toISOString(),
        role: "creator",
        lessonCount: product.course?.lessonCount || product._count.videos,
        progressPct: 0,
      });
    }

    return enrolled;
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return demoListEnrollments(userId);
  }
}

export async function getCheckoutPreview(slug: string, buyerId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { creator: { select: { displayName: true, username: true } } },
    });
    if (!product) return null;
    const [buyer, platform] = await Promise.all([
      prisma.user.findUnique({
        where: { id: buyerId },
        select: { invitedById: true },
      }),
      prisma.user.findFirst({
        where: {
          OR: [
            { email: PLATFORM_ADMIN.email },
            { username: { equals: PLATFORM_ADMIN.username, mode: "insensitive" } },
            { referralCode: { equals: PLATFORM_ADMIN.referralCode, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      }),
    ]);
    const lines = splitSaleCommissions({
      saleAmount: Number(product.price),
      creatorId: product.creatorId,
      inviterId: buyer?.invitedById,
      platformUserId: platform?.id ?? null,
    });
    return {
      product: {
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: Number(product.price),
        currency: product.currency.trim(),
        creatorName: product.creator.displayName ?? product.creator.username ?? "Creador",
        description: product.description,
        type: product.type,
        billing: "ONE_TIME" as const,
      },
      lines,
      mode: "postgres" as const,
    };
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
  }

  if (!isDemoFallbackAllowed()) return null;

  const product = await demoFindProductBySlug(slug);
  if (!product) return null;
  const db = await loadDemo();
  const creator = db.users.find((user) => user.id === product.creatorId);
  const platformUserId = demoPlatformUserId(db);
  return {
    product: {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      currency: product.currency,
      creatorName: creator?.displayName ?? "Creador",
      description: null,
      type: product.type,
      billing: "ONE_TIME" as const,
    },
    lines: splitSaleCommissions({
      saleAmount: product.price,
      creatorId: product.creatorId,
      inviterId: demoInviterId(db, buyerId),
      platformUserId,
    }),
    mode: "demo" as const,
  };
}

export async function loadHub(userId: string) {
  try {
    await releaseMatureCommissions(userId);
    const [wallet, stats, user, invitedCount, top] = await Promise.all([
      prisma.wallet.findUnique({ where: { userId } }),
      prisma.userStats.findUnique({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, referralCode: true, image: true },
      }),
      prisma.user.count({ where: { invitedById: userId } }),
      prisma.userStats.findMany({
        where: { user: { email: { not: "platform@klikhubb.internal" } } },
        orderBy: { points: "desc" },
        take: 5,
        include: { user: { select: { displayName: true, username: true } } },
      }),
    ]);

    const leaderboard: LeaderboardRow[] = top.map((row, index) => ({
      rank: index + 1,
      name: row.user.displayName ?? row.user.username ?? "Miembro",
      handle: row.user.username ?? "user",
      points: row.points,
      earnings: Number(row.totalSales),
    }));

    return {
      displayName: user?.displayName ?? "Miembro",
      image: user?.image ?? null,
      referralCode: user?.referralCode ?? "",
      invitedCount,
      points: stats?.points ?? 0,
      wallet: {
        available: Number(wallet?.available ?? 0),
        pending: Number(wallet?.pending ?? 0),
        lifetimeEarned: Number(wallet?.lifetimeEarned ?? 0),
      },
      leaderboard,
      demo: false as const,
    };
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return demoHub(userId);
  }
}
