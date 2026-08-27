import { prisma } from "@/lib/prisma";
import { isConnectionError } from "@/lib/demo/store";

export type AcademyLesson = {
  id: string;
  title: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  moduleTitle: string;
  sortOrder: number;
};

export type AcademyCourse = {
  productId: string;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  role: "student" | "creator";
  progressPct: number;
  lessons: AcademyLesson[];
};

export async function loadAcademyCourse(
  userId: string,
  slug: string,
): Promise<AcademyCourse | "not_found" | "forbidden"> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        type: true,
        creatorId: true,
        status: true,
      },
    });
    if (!product || product.status !== "ACTIVE") return "not_found";

    const isCreator = product.creatorId === userId;
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_productId: { userId, productId: product.id } },
    });
    const isStudent = enrollment?.status === "ACTIVE";
    if (!isCreator && !isStudent) return "forbidden";

    await ensureLessonsFromVideos(product.id);

    const course = await prisma.course.findUnique({
      where: { productId: product.id },
      include: {
        modules: {
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: {
              orderBy: { sortOrder: "asc" },
              include: {
                video: { select: { videoUrl: true, thumbnailUrl: true, title: true } },
              },
            },
          },
        },
      },
    });

    const lessons: AcademyLesson[] = [];
    for (const module of course?.modules ?? []) {
      for (const lesson of module.lessons) {
        lessons.push({
          id: lesson.id,
          title: lesson.title || lesson.video?.title || "Lección",
          videoUrl: lesson.video?.videoUrl ?? null,
          thumbnailUrl: lesson.video?.thumbnailUrl ?? null,
          moduleTitle: module.title,
          sortOrder: lesson.sortOrder,
        });
      }
    }

    if (lessons.length === 0) {
      const attached = await prisma.videoProduct.findMany({
        where: { productId: product.id, video: { status: "PUBLISHED" } },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        include: { video: { select: { id: true, title: true, videoUrl: true, thumbnailUrl: true } } },
      });
      for (const row of attached) {
        lessons.push({
          id: row.video.id,
          title: row.video.title,
          videoUrl: row.video.videoUrl,
          thumbnailUrl: row.video.thumbnailUrl,
          moduleTitle: "Contenido",
          sortOrder: row.sortOrder,
        });
      }
    }

    return {
      productId: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      type: product.type,
      role: isCreator ? "creator" : "student",
      progressPct: Number(enrollment?.progressPct ?? 0),
      lessons,
    };
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    return "not_found";
  }
}

export async function markLessonProgress(userId: string, productId: string, index: number, total: number) {
  if (total <= 0) return;
  const pct = Math.min(100, Math.round(((index + 1) / total) * 10000) / 100);
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (!enrollment || enrollment.status !== "ACTIVE") return;
  if (Number(enrollment.progressPct) >= pct) return;
  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { progressPct: pct },
  });
}

async function ensureLessonsFromVideos(productId: string) {
  const existing = await prisma.lesson.count({
    where: { module: { course: { productId } } },
  });
  if (existing > 0) return;

  const attached = await prisma.videoProduct.findMany({
    where: { productId, video: { status: "PUBLISHED", videoUrl: { not: null } } },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    include: { video: { select: { id: true, title: true } } },
  });
  if (attached.length === 0) return;

  let course = await prisma.course.findUnique({
    where: { productId },
    include: { modules: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  if (!course) {
    course = await prisma.course.create({
      data: {
        productId,
        lessonCount: attached.length,
        modules: { create: { title: "Empieza aquí", sortOrder: 0 } },
      },
      include: { modules: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });
  } else if (course.modules.length === 0) {
    const module = await prisma.courseModule.create({
      data: { courseId: course.id, title: "Empieza aquí", sortOrder: 0 },
    });
    course.modules = [module];
  }

  const moduleId = course.modules[0]?.id;
  if (!moduleId) return;

  for (let index = 0; index < attached.length; index += 1) {
    const row = attached[index];
    if (!row) continue;
    await prisma.lesson.create({
      data: {
        moduleId,
        title: row.video.title,
        videoId: row.video.id,
        sortOrder: index,
      },
    });
  }

  await prisma.course.update({
    where: { id: course.id },
    data: { lessonCount: attached.length },
  });
}
