import type { ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { joinMembershipCommunity } from "@/lib/community";
import { hashtagsFromCaption, slugifyName } from "@/lib/video/naming";
import { posterFromVideoUrl } from "@/lib/video/types";

export async function ensureCreatorAccount(userId: string) {
  await prisma.userRole.upsert({
    where: { userId_role: { userId, role: "CREATOR" } },
    update: {},
    create: { userId, role: "CREATOR" },
  });
  await prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function publishClip(input: {
  creatorId: string;
  caption: string;
  videoUrl: string;
  title?: string;
  productSlug?: string;
  offer?: {
    title: string;
    price: number;
    type: ProductType;
    description?: string;
  };
  lane?: "PLAY" | "SHOP";
}) {
  await ensureCreatorAccount(input.creatorId);
  const title = (input.title?.trim() || input.caption).slice(0, 120);
  const tags = hashtagsFromCaption(input.caption);
  const lane = input.lane ?? (input.offer || input.productSlug ? "SHOP" : "PLAY");

  return prisma.$transaction(async (tx) => {
    let productId: string | null = null;
    let productType: ProductType | null = null;
    let membershipProduct: {
      id: string;
      slug: string;
      title: string;
      description: string;
      creatorId: string;
    } | null = null;

    if (input.offer) {
      const product = await tx.product.create({
        data: {
          creatorId: input.creatorId,
          type: input.offer.type,
          title: input.offer.title,
          slug: slugifyName(input.offer.title),
          description: input.offer.description?.trim() || input.offer.title,
          price: input.offer.price,
          currency: "USD",
          status: "ACTIVE",
        },
        select: { id: true, type: true, slug: true, title: true, description: true, creatorId: true },
      });
      productId = product.id;
      productType = product.type;
      if (product.type === "MEMBERSHIP") membershipProduct = product;
    } else if (input.productSlug) {
      const existing = await tx.product.findFirst({
        where: { slug: input.productSlug, creatorId: input.creatorId, status: "ACTIVE" },
        select: { id: true, type: true, slug: true, title: true, description: true, creatorId: true },
      });
      if (!existing) {
        throw new Error("PRODUCT_NOT_YOURS");
      }
      productId = existing.id;
      productType = existing.type;
      if (existing.type === "MEMBERSHIP") membershipProduct = existing;
    }

    const video = await tx.video.create({
      data: {
        creatorId: input.creatorId,
        title,
        caption: input.caption,
        videoUrl: input.videoUrl,
        thumbnailUrl: posterFromVideoUrl(input.videoUrl),
        status: "PUBLISHED",
        lane,
        publishedAt: new Date(),
        ...(productId
          ? {
              products: {
                create: { productId, isPrimary: true, ctaLabel: "Comprar" },
              },
            }
          : {}),
      },
      select: { id: true, lane: true },
    });

    for (const slug of tags) {
      const tag = await tx.tag.upsert({
        where: { slug },
        update: { videoCount: { increment: 1 } },
        create: { slug, name: slug, videoCount: 1 },
      });
      await tx.videoTag.create({ data: { videoId: video.id, tagId: tag.id } });
    }

    if (productId && (productType === "COURSE" || productType === "MEMBERSHIP" || productType === "DIGITAL")) {
      const existingCourse = await tx.course.findUnique({
        where: { productId },
        include: { modules: { orderBy: { sortOrder: "asc" }, take: 1 } },
      });
      if (!existingCourse) {
        await tx.course.create({
          data: {
            productId,
            lessonCount: 1,
            modules: {
              create: {
                title: "Empieza aquí",
                sortOrder: 0,
                lessons: {
                  create: {
                    title,
                    videoId: video.id,
                    sortOrder: 0,
                  },
                },
              },
            },
          },
        });
      } else {
        let moduleId = existingCourse.modules[0]?.id;
        if (!moduleId) {
          const created = await tx.courseModule.create({
            data: { courseId: existingCourse.id, title: "Empieza aquí", sortOrder: 0 },
          });
          moduleId = created.id;
        }
        await tx.lesson.create({
          data: {
            moduleId,
            title,
            videoId: video.id,
            sortOrder: existingCourse.lessonCount,
          },
        });
        await tx.course.update({
          where: { id: existingCourse.id },
          data: { lessonCount: { increment: 1 } },
        });
      }
    }

    if (membershipProduct) {
      await joinMembershipCommunity(tx, membershipProduct, input.creatorId);
    }

    return video;
  });
}
