import { prisma } from "@/lib/prisma";
import { shouldUseDemoFallback } from "@/lib/demo/store";

export class ReviewError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "FORBIDDEN" | "INVALID",
  ) {
    super(message);
  }
}

export type ProductReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  displayName: string;
};

export type ProductReviewSummary = {
  average: number;
  count: number;
  items: ProductReviewItem[];
  mine: ProductReviewItem | null;
};

const emptySummary = (): ProductReviewSummary => ({
  average: 0,
  count: 0,
  items: [],
  mine: null,
});

function mapItem(row: {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: { displayName: string | null; username: string | null };
}): ProductReviewItem {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
    displayName: row.user.displayName ?? row.user.username ?? "Alumno",
  };
}

export async function listProductReviews(productId: string, userId?: string | null): Promise<ProductReviewSummary> {
  try {
    const [aggregate, items, mine] = await Promise.all([
      prisma.productReview.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.productReview.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: { select: { displayName: true, username: true } } },
      }),
      userId
        ? prisma.productReview.findUnique({
            where: { userId_productId: { userId, productId } },
            include: { user: { select: { displayName: true, username: true } } },
          })
        : Promise.resolve(null),
    ]);

    return {
      average: Number(aggregate._avg.rating ?? 0),
      count: aggregate._count._all,
      items: items.map(mapItem),
      mine: mine ? mapItem(mine) : null,
    };
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return emptySummary();
  }
}

export async function upsertProductReview(
  userId: string,
  slug: string,
  input: { rating: number; comment: string | null },
) {
  if (input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating)) {
    throw new ReviewError("La calificación va de 1 a 5.", "INVALID");
  }
  const comment = input.comment?.trim() || null;
  if (comment && comment.length > 400) {
    throw new ReviewError("El comentario es demasiado largo.", "INVALID");
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, creatorId: true, status: true },
  });
  if (!product || product.status !== "ACTIVE") {
    throw new ReviewError("Este curso no está a la venta.", "NOT_FOUND");
  }
  if (product.creatorId === userId) {
    throw new ReviewError("No puedes calificar tu propio curso.", "FORBIDDEN");
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_productId: { userId, productId: product.id } },
    select: { status: true },
  });
  if (enrollment?.status !== "ACTIVE") {
    throw new ReviewError("Compra el curso para dejar una opinión.", "FORBIDDEN");
  }

  const row = await prisma.productReview.upsert({
    where: { userId_productId: { userId, productId: product.id } },
    create: {
      userId,
      productId: product.id,
      rating: input.rating,
      comment,
    },
    update: { rating: input.rating, comment },
    include: { user: { select: { displayName: true, username: true } } },
  });

  return mapItem(row);
}
