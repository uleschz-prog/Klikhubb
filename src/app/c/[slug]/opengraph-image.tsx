import { prisma } from "@/lib/prisma";
import {
  createCourseShareImage,
  createShareImage,
  ogImageContentType,
  ogImageSize,
} from "@/lib/og/share-card";
import { formatCatalogPrice } from "@/lib/commerce/display-fx";

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
      priceLabel: (() => {
        const price = formatCatalogPrice(Number(product.price), product.currency.trim());
        return price.secondary ? `${price.primary} · ${price.secondary}` : price.primary;
      })(),
    });
  } catch {
    return createShareImage();
  }
}
