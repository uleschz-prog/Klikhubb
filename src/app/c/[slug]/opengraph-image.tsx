import { prisma } from "@/lib/prisma";
import {
  createCourseShareImage,
  createShareImage,
  ogImageContentType,
  ogImageSize,
} from "@/lib/og/share-card";
import { formatProductPrice } from "@/lib/commerce/billing";

export const runtime = "nodejs";
export const alt = "Curso en Qlyk";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function CourseOpenGraphImage({ params }: { params: { slug: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      select: {
        title: true,
        price: true,
        currency: true,
        status: true,
        creator: { select: { displayName: true, username: true } },
      },
    });
    if (!product || product.status !== "ACTIVE") return createShareImage();

    return createCourseShareImage({
      title: product.title,
      creatorName: product.creator.displayName ?? product.creator.username ?? "Creador",
      priceLabel: formatProductPrice(Number(product.price), product.currency.trim()),
    });
  } catch {
    return createShareImage();
  }
}
