import type { ProductBilling, ProductStatus, ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureCreatorAccount } from "@/lib/video/publish";
import { slugifyName } from "@/lib/video/naming";
import { isAllowedVideoUrl, normalizeVideoUrl } from "@/lib/video/source";
import { posterFromVideoUrl } from "@/lib/video/types";
import { shouldUseDemoFallback } from "@/lib/demo/store";

export type StudioLesson = {
  id: string;
  title: string;
  content: string | null;
  resourceUrl: string | null;
  resourceName: string | null;
  sortOrder: number;
  isFreePreview: boolean;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  videoId: string | null;
};

export type StudioModule = {
  id: string;
  title: string;
  sortOrder: number;
  lessons: StudioLesson[];
};

export type StudioCourse = {
  productId: string;
  courseId: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  status: ProductStatus;
  billing: ProductBilling;
  type: ProductType;
  level: string | null;
  lessonCount: number;
  modules: StudioModule[];
};

export type StudioCourseSummary = {
  slug: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  status: ProductStatus;
  billing: ProductBilling;
  type: ProductType;
  lessonCount: number;
  moduleCount: number;
  updatedAt: string;
};

export class StudioError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 400,
  ) {
    super(message);
    this.name = "StudioError";
  }
}

export async function listStudioCourses(creatorId: string): Promise<StudioCourseSummary[]> {
  try {
    const rows = await prisma.product.findMany({
      where: {
        creatorId,
        type: { in: ["COURSE", "MEMBERSHIP", "DIGITAL"] },
        status: { not: "ARCHIVED" },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        course: {
          select: {
            lessonCount: true,
            _count: { select: { modules: true } },
          },
        },
      },
    });

    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      description: row.description,
      price: Number(row.price),
      currency: row.currency.trim(),
      status: row.status,
      billing: row.billing,
      type: row.type,
      lessonCount: row.course?.lessonCount ?? 0,
      moduleCount: row.course?._count.modules ?? 0,
      updatedAt: row.updatedAt.toISOString(),
    }));
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
    return [];
  }
}

export async function loadStudioCourse(creatorId: string, slug: string): Promise<StudioCourse | null> {
  const product = await prisma.product.findFirst({
    where: { slug, creatorId },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: {
                orderBy: { sortOrder: "asc" },
                include: {
                  video: { select: { id: true, videoUrl: true, thumbnailUrl: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!product) return null;

  let course = product.course;
  if (!course) {
    course = await prisma.course.create({
      data: {
        productId: product.id,
        lessonCount: 0,
        modules: { create: { title: "Módulo 1", sortOrder: 0 } },
      },
      include: {
        modules: {
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: {
              orderBy: { sortOrder: "asc" },
              include: {
                video: { select: { id: true, videoUrl: true, thumbnailUrl: true } },
              },
            },
          },
        },
      },
    });
  }

  return {
    productId: product.id,
    courseId: course.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    price: Number(product.price),
    currency: product.currency.trim(),
    status: product.status,
    billing: product.billing,
    type: product.type,
    level: course.level,
    lessonCount: course.lessonCount,
    modules: course.modules.map((mod) => ({
      id: mod.id,
      title: mod.title,
      sortOrder: mod.sortOrder,
      lessons: mod.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        resourceUrl: lesson.resourceUrl,
        resourceName: lesson.resourceName,
        sortOrder: lesson.sortOrder,
        isFreePreview: lesson.isFreePreview,
        videoUrl: lesson.video?.videoUrl ?? null,
        thumbnailUrl: lesson.video?.thumbnailUrl ?? null,
        videoId: lesson.videoId,
      })),
    })),
  };
}

export async function createStudioCourse(
  creatorId: string,
  input: {
    title: string;
    description?: string;
    price: number;
    level?: string;
    slug?: string;
    billing?: ProductBilling;
  },
) {
  await ensureCreatorAccount(creatorId);
  const slug = input.slug?.trim() || slugifyName(input.title);
  const billing = input.billing ?? "ONE_TIME";

  const product = await prisma.product.create({
    data: {
      creatorId,
      type: "COURSE",
      title: input.title,
      slug,
      description: input.description?.trim() || input.title,
      price: input.price,
      currency: "USD",
      status: "DRAFT",
      billing,
      course: {
        create: {
          level: input.level?.trim() || null,
          lessonCount: 0,
          modules: { create: { title: "Módulo 1", sortOrder: 0 } },
        },
      },
    },
    select: { slug: true },
  });

  return product;
}

export async function updateStudioCourse(
  creatorId: string,
  slug: string,
  input: {
    title?: string;
    description?: string;
    price?: number;
    level?: string | null;
    status?: ProductStatus;
    billing?: ProductBilling;
  },
) {
  const product = await requireOwnedProduct(creatorId, slug);
  if (input.billing !== undefined && input.billing !== product.billing && product.status !== "DRAFT") {
    throw new StudioError(
      "Solo puedes cambiar el modelo de cobro mientras el curso está en borrador.",
      "BILLING_LOCKED",
      400,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: product.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.billing !== undefined ? { billing: input.billing } : {}),
      },
    });
    if (input.level !== undefined) {
      await tx.course.update({
        where: { productId: product.id },
        data: { level: input.level },
      });
    }
  });
}

export async function addStudioModule(creatorId: string, slug: string, title: string) {
  const product = await requireOwnedProduct(creatorId, slug);
  const course = await requireCourse(product.id);
  const maxSort = await prisma.courseModule.aggregate({
    where: { courseId: course.id },
    _max: { sortOrder: true },
  });
  return prisma.courseModule.create({
    data: {
      courseId: course.id,
      title,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
    select: { id: true, title: true, sortOrder: true },
  });
}

export async function updateStudioModule(
  creatorId: string,
  moduleId: string,
  input: { title?: string; sortOrder?: number },
) {
  await requireOwnedModule(creatorId, moduleId);
  return prisma.courseModule.update({
    where: { id: moduleId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
    select: { id: true, title: true, sortOrder: true },
  });
}

export async function deleteStudioModule(creatorId: string, moduleId: string) {
  const mod = await requireOwnedModule(creatorId, moduleId);
  const siblingCount = await prisma.courseModule.count({ where: { courseId: mod.courseId } });
  if (siblingCount <= 1) {
    throw new StudioError("Deja al menos un módulo en el curso.", "LAST_MODULE", 400);
  }
  await prisma.$transaction(async (tx) => {
    await tx.courseModule.delete({ where: { id: moduleId } });
    await syncLessonCount(tx, mod.courseId);
  });
}

export async function addStudioLesson(
  creatorId: string,
  moduleId: string,
  input: {
    title: string;
    content?: string;
    videoUrl?: string;
    resourceUrl?: string;
    resourceName?: string;
    isFreePreview?: boolean;
    publishToFeed?: boolean;
  },
) {
  const mod = await requireOwnedModule(creatorId, moduleId);
  const maxSort = await prisma.lesson.aggregate({
    where: { moduleId },
    _max: { sortOrder: true },
  });

  let videoId: string | null = null;
  if (input.videoUrl) {
    const normalized = normalizeVideoUrl(input.videoUrl);
    if (!isAllowedVideoUrl(normalized)) {
      throw new StudioError("URL de video no válida. Usa YouTube o un MP4 https.", "BAD_VIDEO", 400);
    }
    const video = await prisma.video.create({
      data: {
        creatorId,
        title: input.title.slice(0, 120),
        caption: input.title.slice(0, 500),
        videoUrl: normalized,
        thumbnailUrl: posterFromVideoUrl(normalized),
        status: input.publishToFeed ? "PUBLISHED" : "DRAFT",
        lane: "SHOP",
        publishedAt: input.publishToFeed ? new Date() : null,
      },
      select: { id: true },
    });
    videoId = video.id;

    if (input.publishToFeed) {
      const product = await prisma.course.findUnique({
        where: { id: mod.courseId },
        select: { productId: true },
      });
      if (product) {
        await prisma.videoProduct.create({
          data: {
            videoId: video.id,
            productId: product.productId,
            isPrimary: false,
            ctaLabel: "Comprar",
          },
        });
      }
    }
  }

  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      title: input.title,
      content: input.content?.trim() || null,
      resourceUrl: input.resourceUrl?.trim() || null,
      resourceName: input.resourceName?.trim() || null,
      videoId,
      isFreePreview: Boolean(input.isFreePreview),
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
    select: { id: true },
  });

  await syncLessonCount(prisma, mod.courseId);
  return lesson;
}

export async function updateStudioLesson(
  creatorId: string,
  lessonId: string,
  input: {
    title?: string;
    content?: string | null;
    videoUrl?: string | null;
    resourceUrl?: string | null;
    resourceName?: string | null;
    isFreePreview?: boolean;
    sortOrder?: number;
  },
) {
  const lesson = await requireOwnedLesson(creatorId, lessonId);

  let videoId = lesson.videoId;
  if (input.videoUrl === null) {
    videoId = null;
  } else if (typeof input.videoUrl === "string") {
    const normalized = normalizeVideoUrl(input.videoUrl);
    if (!isAllowedVideoUrl(normalized)) {
      throw new StudioError("URL de video no válida. Usa YouTube o un MP4 https.", "BAD_VIDEO", 400);
    }
    if (lesson.videoId) {
      await prisma.video.update({
        where: { id: lesson.videoId },
        data: {
          videoUrl: normalized,
          thumbnailUrl: posterFromVideoUrl(normalized),
          title: (input.title ?? lesson.title).slice(0, 120),
        },
      });
      videoId = lesson.videoId;
    } else {
      const video = await prisma.video.create({
        data: {
          creatorId,
          title: (input.title ?? lesson.title).slice(0, 120),
          caption: (input.title ?? lesson.title).slice(0, 500),
          videoUrl: normalized,
          thumbnailUrl: posterFromVideoUrl(normalized),
          status: "DRAFT",
          lane: "SHOP",
        },
        select: { id: true },
      });
      videoId = video.id;
    }
  }

  return prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.resourceUrl !== undefined ? { resourceUrl: input.resourceUrl } : {}),
      ...(input.resourceName !== undefined ? { resourceName: input.resourceName } : {}),
      ...(input.isFreePreview !== undefined ? { isFreePreview: input.isFreePreview } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.videoUrl !== undefined ? { videoId } : {}),
    },
    select: { id: true },
  });
}

export async function deleteStudioLesson(creatorId: string, lessonId: string) {
  const lesson = await requireOwnedLesson(creatorId, lessonId);
  await prisma.$transaction(async (tx) => {
    await tx.lesson.delete({ where: { id: lessonId } });
    await syncLessonCount(tx, lesson.courseId);
  });
}

export async function moveStudioLesson(
  creatorId: string,
  lessonId: string,
  direction: "up" | "down",
) {
  const lesson = await requireOwnedLesson(creatorId, lessonId);
  const siblings = await prisma.lesson.findMany({
    where: { moduleId: lesson.moduleId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });
  const index = siblings.findIndex((row) => row.id === lessonId);
  const swapWith = direction === "up" ? siblings[index - 1] : siblings[index + 1];
  if (!swapWith || index < 0) return;

  await prisma.$transaction([
    prisma.lesson.update({ where: { id: lesson.id }, data: { sortOrder: swapWith.sortOrder } }),
    prisma.lesson.update({ where: { id: swapWith.id }, data: { sortOrder: lesson.sortOrder } }),
  ]);
}

async function requireOwnedProduct(creatorId: string, slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, creatorId },
    select: { id: true, slug: true, status: true, billing: true },
  });
  if (!product) throw new StudioError("Curso no encontrado.", "NOT_FOUND", 404);
  return product;
}

async function requireCourse(productId: string) {
  const course = await prisma.course.findUnique({ where: { productId }, select: { id: true } });
  if (!course) throw new StudioError("El curso aún no está listo.", "NO_COURSE", 404);
  return course;
}

async function requireOwnedModule(creatorId: string, moduleId: string) {
  const mod = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      courseId: true,
      course: { select: { product: { select: { creatorId: true } } } },
    },
  });
  if (!mod || mod.course.product.creatorId !== creatorId) {
    throw new StudioError("Módulo no encontrado.", "NOT_FOUND", 404);
  }
  return { id: mod.id, courseId: mod.courseId };
}

async function requireOwnedLesson(creatorId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      videoId: true,
      moduleId: true,
      sortOrder: true,
      module: {
        select: {
          courseId: true,
          course: { select: { product: { select: { creatorId: true } } } },
        },
      },
    },
  });
  if (!lesson || lesson.module.course.product.creatorId !== creatorId) {
    throw new StudioError("Lección no encontrada.", "NOT_FOUND", 404);
  }
  return {
    id: lesson.id,
    title: lesson.title,
    videoId: lesson.videoId,
    moduleId: lesson.moduleId,
    sortOrder: lesson.sortOrder,
    courseId: lesson.module.courseId,
  };
}

async function syncLessonCount(
  client: { course: { update: typeof prisma.course.update }; lesson: { count: typeof prisma.lesson.count } },
  courseId: string,
) {
  const lessonCount = await client.lesson.count({
    where: { module: { courseId } },
  });
  await client.course.update({
    where: { id: courseId },
    data: { lessonCount },
  });
}
