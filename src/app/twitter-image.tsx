import {
  createShareImage,
  ogImageContentType,
  ogImageSize,
} from "@/lib/og/share-card";

export const runtime = "edge";
export const alt = "Qlyk — Del video al pago. Sin salir del feed.";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function TwitterImage() {
  return createShareImage();
}
