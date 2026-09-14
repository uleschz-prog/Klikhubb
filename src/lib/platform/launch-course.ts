import { prisma } from "@/lib/prisma";
import { ensurePlatformAdmin } from "@/lib/auth/ensure-admin";
import {
  addStudioLesson,
  createStudioCourse,
  loadStudioCourse,
  updateStudioCourse,
  updateStudioModule,
} from "@/lib/commerce/studio";
import { posterFromVideoUrl } from "@/lib/video/types";

export const LAUNCH_COURSE = {
  slugPrefix: "cierre-qlyk",
  fallbackSlug: "cierre-qlyk",
  title: "Cierre Qlyk",
  description:
    "El loop de Qlyk: un clip, una compra, el curso en Academy. Preview gratis y el resto cuando pagas.",
  price: 49,
  level: "Principiante",
  videoUrl: "/videos/qlyk-hero-premium.mp4",
  shopTitle: "Cierre Qlyk — preview del curso",
  shopCaption: "Preview del curso Cierre Qlyk. Entra, paga una vez y continúa. #qlyk #cierre",
  moduleTitle: "El cierre",
  lessons: [
    {
      title: "Preview: así se cierra en Qlyk",
      content:
        "Un clip vertical, una oferta y Academy. Esta lección es gratis. El resto del curso se abre cuando compras.",
      isFreePreview: true,
    },
    {
      title: "Publica el clip que vende",
      content:
        "En Tienda el clip lleva el curso. Quien aún no compra ve Comprar. Quien ya pagó ve Continuar.",
      isFreePreview: false,
    },
    {
      title: "Paga y entra a Academy",
      content:
        "Tarjeta o SPEI. Al confirmar, el botón principal abre el curso. No te deja en una pantalla de pedido vacío.",
      isFreePreview: false,
    },
    {
      title: "Si ya compraste, continúa",
      content:
        "Checkout no te vuelve a cobrar. El clip y la ficha dicen Continuar y te llevan a la lección.",
      isFreePreview: false,
    },
  ],
} as const;

export type LaunchCourseStatus = {
  exists: boolean;
  slug: string | null;
  title: string | null;
  status: string | null;
  lessonCount: number;
  previewCount: number;
  shopClipId: string | null;
  links: {
    ficha: string;
    academy: string;
    studio: string;
    feed: string;
  };
};

function emptyStatus(): LaunchCourseStatus {
  return {
    exists: false,
    slug: null,
    title: null,
    status: null,
    lessonCount: 0,
    previewCount: 0,
    shopClipId: null,
    links: {
      ficha: "/c/cierre-qlyk",
      academy: "/academy/cierre-qlyk",
      studio: "/studio/cierre-qlyk",
      feed: "/feed",
    },
  };
}

export async function findLaunchProduct() {
  return prisma.product.findFirst({
    where: {
      type: "COURSE",
      status: { not: "ARCHIVED" },
      slug: { startsWith: LAUNCH_COURSE.slugPrefix },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      creatorId: true,
    },
  });
}

export async function getLaunchCourseStatus(): Promise<LaunchCourseStatus> {
  const product = await findLaunchProduct();
  if (!product) return emptyStatus();

  const [lessonCount, previewCount, shopClip] = await Promise.all([
    prisma.lesson.count({ where: { module: { course: { productId: product.id } } } }),
    prisma.lesson.count({
      where: { module: { course: { productId: product.id } }, isFreePreview: true },
    }),
    prisma.video.findFirst({
      where: {
        status: "PUBLISHED",
        lane: "SHOP",
        products: { some: { productId: product.id } },
      },
      select: { id: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  return {
    exists: true,
    slug: product.slug,
    title: product.title,
    status: product.status,
    lessonCount,
    previewCount,
    shopClipId: shopClip?.id ?? null,
    links: {
      ficha: `/c/${product.slug}`,
      academy: `/academy/${product.slug}`,
      studio: `/studio/${product.slug}`,
      feed: shopClip ? `/feed?v=${shopClip.id}` : "/feed",
    },
  };
}

export type PublishLaunchCourseResult = LaunchCourseStatus & {
  created: { course: boolean; lessons: number; shopClip: boolean; activated: boolean };
};

export async function publishLaunchCourse(): Promise<PublishLaunchCourseResult> {
  const admin = await ensurePlatformAdmin();
  const created = { course: false, lessons: 0, shopClip: false, activated: false };
  const videoUrl = LAUNCH_COURSE.videoUrl;

  let product = await findLaunchProduct();
  if (!product) {
    await createStudioCourse(admin.id, {
      title: LAUNCH_COURSE.title,
      description: LAUNCH_COURSE.description,
      price: LAUNCH_COURSE.price,
      level: LAUNCH_COURSE.level,
      slug: LAUNCH_COURSE.fallbackSlug,
    });
    product = await findLaunchProduct();
    created.course = true;
  }

  if (!product) {
    throw new Error("No se pudo crear Cierre Qlyk.");
  }

  const creatorId = product.creatorId;
  let course = await loadStudioCourse(creatorId, product.slug);
  if (!course) {
    throw new Error("El curso no cargó en Studio.");
  }

  if (course.modules[0] && course.modules[0].title !== LAUNCH_COURSE.moduleTitle) {
    await updateStudioModule(creatorId, course.modules[0].id, { title: LAUNCH_COURSE.moduleTitle });
  }

  if (product.status !== "ACTIVE") {
    await updateStudioCourse(creatorId, product.slug, { status: "ACTIVE" });
    created.activated = true;
  }

  if (!course.description || course.description === course.title) {
    await updateStudioCourse(creatorId, product.slug, { description: LAUNCH_COURSE.description });
  }

  course = await loadStudioCourse(creatorId, product.slug);
  const moduleId = course?.modules[0]?.id;
  if (!moduleId || !course) {
    throw new Error("El curso no tiene módulo.");
  }

  const existingTitles = new Set(
    course.modules.flatMap((mod) => mod.lessons.map((lesson) => lesson.title)),
  );

  for (const lesson of LAUNCH_COURSE.lessons) {
    if (existingTitles.has(lesson.title)) continue;
    await addStudioLesson(creatorId, moduleId, {
      title: lesson.title,
      content: lesson.content,
      isFreePreview: lesson.isFreePreview,
      videoUrl,
      publishToFeed: false,
    });
    created.lessons += 1;
  }

  const shop = await ensureLaunchShopClip(creatorId, product.id, videoUrl);
  created.shopClip = shop.created;

  const status = await getLaunchCourseStatus();
  return { ...status, created };
}

async function ensureLaunchShopClip(creatorId: string, productId: string, videoUrl: string) {
  const existing = await prisma.video.findFirst({
    where: {
      creatorId,
      status: "PUBLISHED",
      lane: "SHOP",
      products: { some: { productId } },
    },
    select: { id: true },
    orderBy: { publishedAt: "desc" },
  });

  if (existing) {
    await prisma.videoProduct.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });
    await prisma.videoProduct.updateMany({
      where: { videoId: existing.id, productId },
      data: { isPrimary: true, ctaLabel: "Comprar" },
    });
    return { id: existing.id, created: false };
  }

  const video = await prisma.video.create({
    data: {
      creatorId,
      title: LAUNCH_COURSE.shopTitle,
      caption: LAUNCH_COURSE.shopCaption,
      videoUrl,
      thumbnailUrl: posterFromVideoUrl(videoUrl),
      status: "PUBLISHED",
      lane: "SHOP",
      publishedAt: new Date(),
      products: {
        create: { productId, isPrimary: true, ctaLabel: "Comprar" },
      },
    },
    select: { id: true },
  });

  return { id: video.id, created: true };
}
