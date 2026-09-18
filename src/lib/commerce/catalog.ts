import { prisma } from "@/lib/prisma";
import { splitSaleCommissions } from "@/lib/commerce/split";
import { CommerceError } from "@/lib/commerce/settle-order";
import { releaseMatureCommissions } from "@/lib/commerce/wallet";
import {
  demoFindProductBySlug,
  demoHasEnrollment,
  demoHub,
  demoListEnrollments,
  demoListProducts,
  isDemoFallbackAllowed,
  shouldUseDemoFallback,
  loadDemo,
} from "@/lib/demo/store";
import type { LeaderboardRow } from "@/components/gamification/Leaderboard";

const RETIRED_SLUG = "qlyk-academy";

export type CatalogProduct = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  creatorId: string;
  type: string;
  billing: "ONE_TIME" | "MONTHLY";
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
        billing: row.billing === "MONTHLY" ? "MONTHLY" : "ONE_TIME",
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
  if (product.slug === RETIRED_SLUG) {
    throw new CommerceError("Este producto no está disponible.", "PRODUCT_UNAVAILABLE");
  }
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
      where: { status: "ACTIVE", slug: { not: RETIRED_SLUG } },
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
      billing: row.billing === "MONTHLY" ? ("MONTHLY" as const) : ("ONE_TIME" as const),
    }));
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    const demo = await demoListProducts();
    return demo
      .filter((row) => row.slug !== RETIRED_SLUG)
      .map((row) => ({
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

export type CourseEnrollment = {
  slug: string;
  title: string;
  description: string | null;
  type: string;
  enrolledAt: string;
  role: "student" | "creator";
  lessonCount: number;
  progressPct: number;
  resumeLessonId: string | null;
  resumeLessonTitle: string | null;
};

export async function listMyCourses(userId: string): Promise<CourseEnrollment[]> {
  try {
    const [rows, owned] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId, status: "ACTIVE", product: { slug: { not: RETIRED_SLUG } } },
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
          slug: { not: RETIRED_SLUG },
          type: { in: ["COURSE", "MEMBERSHIP", "DIGITAL"] },
        },
        orderBy: { createdAt: "desc" },
        include: { course: { select: { lessonCount: true } }, _count: { select: { videos: true } } },
      }),
    ]);

    const resumeIds = rows
      .map((row) => row.lastLessonId)
      .filter((id): id is string => Boolean(id));
    const [resumeLessons, resumeVideos] = resumeIds.length
      ? await Promise.all([
          prisma.lesson.findMany({ where: { id: { in: resumeIds } }, select: { id: true, title: true } }),
          prisma.video.findMany({ where: { id: { in: resumeIds } }, select: { id: true, title: true } }),
        ])
      : [[], []];
    const resumeTitles = new Map<string, string>();
    for (const lesson of resumeLessons) resumeTitles.set(lesson.id, lesson.title);
    for (const video of resumeVideos) {
      if (!resumeTitles.has(video.id)) resumeTitles.set(video.id, video.title);
    }

    const enrolled: CourseEnrollment[] = rows.map((row) => ({
      slug: row.product.slug,
      title: row.product.title,
      description: row.product.description,
      type: row.product.type,
      enrolledAt: row.createdAt.toISOString(),
      role: "student" as const,
      lessonCount: row.product.course?.lessonCount || row.product._count.videos,
      progressPct: Number(row.progressPct),
      resumeLessonId: row.lastLessonId,
      resumeLessonTitle: row.lastLessonId ? resumeTitles.get(row.lastLessonId) ?? null : null,
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
        resumeLessonId: null,
        resumeLessonTitle: null,
      });
    }

    return enrolled;
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return (await demoListEnrollments(userId)).filter((row) => row.slug !== RETIRED_SLUG);
  }
}

export async function viewerOwnsProduct(userId: string, slug: string): Promise<boolean> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, creatorId: true, slug: true },
    });
    if (!product) return false;
    if (product.slug === RETIRED_SLUG) return false;
    if (product.creatorId === userId) return true;
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_productId: { userId, productId: product.id } },
      select: { status: true },
    });
    return enrollment?.status === "ACTIVE";
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    const product = await demoFindProductBySlug(slug);
    if (!product) return false;
    if (product.creatorId === userId) return true;
    return await demoHasEnrollment(userId, product.id);
  }
}

export async function getCheckoutPreview(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { creator: { select: { displayName: true, username: true } } },
    });
    if (!product || product.status !== "ACTIVE" || product.slug === RETIRED_SLUG) return null;
    const lines = splitSaleCommissions({
      saleAmount: Number(product.price),
      creatorId: product.creatorId,
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
        billing: product.billing === "MONTHLY" ? ("MONTHLY" as const) : ("ONE_TIME" as const),
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
    }),
    mode: "demo" as const,
  };
}

export async function loadHub(userId: string) {
  try {
    await releaseMatureCommissions(userId);
    const [wallet, stats, user, top] = await Promise.all([
      prisma.wallet.findUnique({ where: { userId } }),
      prisma.userStats.findUnique({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, image: true, username: true },
      }),
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
      username: user?.username ?? null,
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
