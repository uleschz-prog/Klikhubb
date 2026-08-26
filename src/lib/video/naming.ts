import { randomBytes } from "crypto";

export function slugifyName(value: string, max = 40) {
  const base =
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, max) || "qlyk";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

export function hashtagsFromCaption(caption: string) {
  const found = caption.match(/#([A-Za-z0-9_]{2,32})/g) ?? [];
  const unique = Array.from(new Set(found.map((tag) => tag.slice(1).toLowerCase())));
  return unique.slice(0, 8);
}

export function isAllowedVideoUrl(url: string) {
  if (/^https:\/\//i.test(url)) return true;
  return /^\/videos\/[A-Za-z0-9._-]+\.(mp4|webm|mov)$/i.test(url);
}
