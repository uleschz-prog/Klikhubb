import { prisma } from "@/lib/prisma";
import { shouldUseDemoFallback } from "@/lib/demo/store";
import { groupLessonsByModule, listCourseLessons, type AcademyLesson } from "@/lib/commerce/academy";
import { listProductReviews, type ProductReviewSummary } from "@/lib/commerce/reviews";

export type PublicLesson = {
  id: string;
  title: string;
  isFreePreview: boolean;
  moduleTitle: string;
  sortOrder: number;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  content: string | null;
};

export type PublicCourse = {
  productId: string;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  price: number;
  currency: string;
  creatorName: string;
  creatorUsername: string | null;
  lessonCount: number;
  previewCount: number;
  access: "guest" | "student" | "creator";
  lessons: PublicLesson[];
  reviews: ProductReviewSummary;
};

function toPublicLesson(lesson: AcademyLesson): PublicLesson {
  const open = lesson.isFreePreview;
  return {
    id: lesson.id,
    title: lesson.title,
    isFreePreview: lesson.isFreePreview,
    moduleTitle: lesson.moduleTitle,
    sortOrder: lesson.sortOrder,
    thumbnailUrl: lesson.thumbnailUrl,
    videoUrl: open ? lesson.videoUrl : null,
    content: open ? lesson.content : null,
  };
}

export async function loadPublicCourse(slug: string, userId: string | null): Promise<PublicCourse | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        type: true,
        price: true,
        currency: true,
        status: true,
        creatorId: true,
        creator: { select: { displayName: true, username: true } },
      },
    });
    if (!product) return null;
    if (product.status !== "ACTIVE" && product.creatorId !== userId) return null;

    const enrollment = userId
      ? await prisma.enrollment.findUnique({
          where: { userId_productId: { userId, productId: product.id } },
          select: { status: true },
        })
      : null;

    const access: PublicCourse["access"] =
      product.creatorId === userId
        ? "creator"
        : enrollment?.status === "ACTIVE"
          ? "student"
          : "guest";

    const rawLessons = await listCourseLessons(product.id);
    const lessons = rawLessons.map(toPublicLesson);
    const reviews = await listProductReviews(product.id, userId);

    return {
      productId: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      type: product.type,
      price: Number(product.price),
      currency: product.currency.trim(),
      creatorName: product.creator.displayName ?? product.creator.username ?? "Creador",
      creatorUsername: product.creator.username,
      lessonCount: lessons.length,
      previewCount: lessons.filter((lesson) => lesson.isFreePreview).length,
      access,
      lessons,
      reviews,
    };
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return null;
  }
}

export { groupLessonsByModule };
