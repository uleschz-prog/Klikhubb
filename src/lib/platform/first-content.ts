import { prisma } from "@/lib/prisma";
import { ensurePlatformAdmin } from "@/lib/auth/ensure-admin";
import {
  addStudioLesson,
  createStudioCourse,
  loadStudioCourse,
  updateStudioCourse,
} from "@/lib/commerce/studio";
import { publishClip } from "@/lib/video/publish";

export const FIRST_CONTENT = {
  courseSlug: "empieza-en-qlyk",
  courseTitle: "Empieza en Qlyk",
  courseDescription:
    "Aprende a publicar clips, vender tu primer curso y cobrar con la red Qlyk. Contenido oficial de la plataforma.",
  coursePrice: 19,
  courseLevel: "Principiante",
  heroVideoPath: "/videos/qlyk-hero-demo.mp4",
  lessons: [
    {
      title: "Bienvenida a Qlyk",
      content:
        "Conoce la experiencia Play y Shop: publica clips verticales, enlaza productos y recibe pagos por transferencia.",
      isFreePreview: true,
      useHeroVideo: true,
    },
    {
      title: "Publica tu primer clip",
      content:
        "Desde /publish subes un video, eliges la lane Shop o Play y, si vendes, enlazas un producto activo.",
      isFreePreview: false,
      useHeroVideo: true,
    },
    {
      title: "Cobra con la red Qlyk",
      content:
        "Cada venta reparte 85% creador, 10% plataforma y 5% invitación. Los retiros se procesan manualmente desde tu monedero.",
      isFreePreview: false,
      useHeroVideo: false,
    },
  ],
  shopClip: {
    title: "Empieza en Qlyk — curso oficial",
    caption: "Tu primer curso en Qlyk: publica, vende y cobra con la red. #qlyk #curso #shop",
  },
  playClip: {
    title: "Así se ve Qlyk",
    caption: "Un vistazo a la experiencia Play en Qlyk. #qlyk #play",
  },
} as const;

function siteBaseUrl() {
  const fromEnv = process.env.SITE_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "https://qlyk.vercel.app";
}

export function resolveFirstContentVideoUrl(path = FIRST_CONTENT.heroVideoPath) {
  if (/^https?:\/\//i.test(path)) return path;
  const base = siteBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export type FirstContentStatus = {
  ready: boolean;
  course: {
    exists: boolean;
    slug: string;
    status: string | null;
    lessonCount: number;
  };
  shopVideo: { exists: boolean; id: string | null };
  playVideo: { exists: boolean; id: string | null };
  links: {
    marketplace: string;
    feed: string;
    play: string;
    studio: string;
  };
};

export async function getFirstContentStatus(): Promise<FirstContentStatus> {
  const slug = FIRST_CONTENT.courseSlug;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      status: true,
      course: { select: { lessonCount: true } },
    },
  });

  const shopVideo = await prisma.video.findFirst({
    where: {
      title: FIRST_CONTENT.shopClip.title,
      lane: "SHOP",
      status: "PUBLISHED",
    },
    select: { id: true },
    orderBy: { publishedAt: "desc" },
  });

  const playVideo = await prisma.video.findFirst({
    where: {
      title: FIRST_CONTENT.playClip.title,
      lane: "PLAY",
      status: "PUBLISHED",
    },
    select: { id: true },
    orderBy: { publishedAt: "desc" },
  });

  const courseExists = Boolean(product);
  const shopExists = Boolean(shopVideo);
  const playExists = Boolean(playVideo);

  return {
    ready: courseExists && product?.status === "ACTIVE" && shopExists && playExists,
    course: {
      exists: courseExists,
      slug,
      status: product?.status ?? null,
      lessonCount: product?.course?.lessonCount ?? 0,
    },
    shopVideo: { exists: shopExists, id: shopVideo?.id ?? null },
    playVideo: { exists: playExists, id: playVideo?.id ?? null },
    links: {
      marketplace: `/marketplace`,
      feed: `/feed`,
      play: `/play`,
      studio: `/studio/${slug}`,
    },
  };
}

export type BootstrapFirstContentResult = FirstContentStatus & {
  created: {
    course: boolean;
    lessons: number;
    shopVideo: boolean;
    playVideo: boolean;
  };
};

/** Crea curso oficial + clips Shop/Play. Idempotente: no duplica si ya existe. */
export async function bootstrapFirstContent(): Promise<BootstrapFirstContentResult> {
  const admin = await ensurePlatformAdmin();
  const creatorId = admin.id;
  const heroUrl = FIRST_CONTENT.heroVideoPath;
  const slug = FIRST_CONTENT.courseSlug;

  const created = { course: false, lessons: 0, shopVideo: false, playVideo: false };

  let course = await loadStudioCourse(creatorId, slug);
  if (!course) {
    await createStudioCourse(creatorId, {
      title: FIRST_CONTENT.courseTitle,
      description: FIRST_CONTENT.courseDescription,
      price: FIRST_CONTENT.coursePrice,
      level: FIRST_CONTENT.courseLevel,
      slug: FIRST_CONTENT.courseSlug,
      billing: "ONE_TIME",
    });
    course = await loadStudioCourse(creatorId, slug);
    created.course = true;
  }

  if (!course) {
    throw new Error("No se pudo crear el curso inicial.");
  }

  const moduleId = course.modules[0]?.id;
  if (!moduleId) {
    throw new Error("El curso no tiene módulo inicial.");
  }

  const existingLessonCount = course.lessonCount;
  if (existingLessonCount < FIRST_CONTENT.lessons.length) {
    for (let index = existingLessonCount; index < FIRST_CONTENT.lessons.length; index += 1) {
      const lesson = FIRST_CONTENT.lessons[index];
      await addStudioLesson(creatorId, moduleId, {
        title: lesson.title,
        content: lesson.content,
        isFreePreview: lesson.isFreePreview,
        videoUrl: lesson.useHeroVideo ? heroUrl : undefined,
        publishToFeed: false,
      });
      created.lessons += 1;
    }
  }

  if (course.status !== "ACTIVE") {
    await updateStudioCourse(creatorId, slug, { status: "ACTIVE" });
  }

  const shopExists = await prisma.video.findFirst({
    where: { title: FIRST_CONTENT.shopClip.title, lane: "SHOP", status: "PUBLISHED", creatorId },
    select: { id: true },
  });

  if (!shopExists) {
    await publishClip({
      creatorId,
      title: FIRST_CONTENT.shopClip.title,
      caption: FIRST_CONTENT.shopClip.caption,
      videoUrl: heroUrl,
      productSlug: slug,
      lane: "SHOP",
    });
    created.shopVideo = true;
  }

  const playExists = await prisma.video.findFirst({
    where: { title: FIRST_CONTENT.playClip.title, lane: "PLAY", status: "PUBLISHED", creatorId },
    select: { id: true },
  });

  if (!playExists) {
    await publishClip({
      creatorId,
      title: FIRST_CONTENT.playClip.title,
      caption: FIRST_CONTENT.playClip.caption,
      videoUrl: heroUrl,
      lane: "PLAY",
    });
    created.playVideo = true;
  }

  const status = await getFirstContentStatus();
  return { ...status, created };
}
