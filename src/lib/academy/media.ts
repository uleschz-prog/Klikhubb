import { put } from "@vercel/blob";
import { isBlobConfigured } from "@/lib/video/types";

function extensionFor(contentType: string, fallback: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("mp4") || contentType.includes("quicktime")) return "mp4";
  return fallback;
}

export async function persistAcademyBytes(input: {
  bytes: Buffer;
  contentType: string;
  filename: string;
}) {
  if (!isBlobConfigured() || input.bytes.length < 32) return null;
  const blob = await put(`academy/${input.filename}`, input.bytes, {
    access: "public",
    contentType: input.contentType,
    addRandomSuffix: true,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  return blob.url;
}

export async function persistAcademyDataUrl(dataUrl: string, filename: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return dataUrl;
  const contentType = match[1];
  const bytes = Buffer.from(match[2], "base64");
  const stored = await persistAcademyBytes({
    bytes,
    contentType,
    filename: `${filename}.${extensionFor(contentType, "bin")}`,
  });
  return stored ?? dataUrl;
}

export async function persistAcademyRemote(input: {
  url: string;
  filename: string;
  headers?: HeadersInit;
  fallbackExt: "png" | "mp4";
}) {
  if (input.url.startsWith("data:")) {
    return persistAcademyDataUrl(input.url, input.filename);
  }
  const response = await fetch(input.url, {
    headers: input.headers,
    redirect: "follow",
  });
  if (!response.ok) return null;
  const type = (response.headers.get("content-type") ?? "").split(";")[0].trim() || "application/octet-stream";
  if (input.fallbackExt === "mp4" && !type.startsWith("video/") && !type.includes("octet-stream")) return null;
  if (input.fallbackExt === "png" && !type.startsWith("image/") && !type.includes("octet-stream")) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 32) return null;
  const stored = await persistAcademyBytes({
    bytes,
    contentType: type,
    filename: `${input.filename}.${extensionFor(type, input.fallbackExt)}`,
  });
  return stored ?? (type.startsWith("image/") || type.startsWith("video/") ? input.url : null);
}
