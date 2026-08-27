import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getDbUserId } from "@/lib/auth/session";
import { isBlobConfigured } from "@/lib/video/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/*",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "audio/mpeg",
  "audio/mp4",
  "image/png",
  "image/jpeg",
  "image/webp",
];

export async function POST(request: Request) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para subir archivos." }, { status: 401 });
  }
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: "Falta BLOB_READ_WRITE_TOKEN en Vercel." }, { status: 503 });
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED,
        maximumSizeInBytes: 400 * 1024 * 1024,
        addRandomSuffix: true,
        cacheControlMaxAge: 60 * 60 * 24 * 30,
        tokenPayload: JSON.stringify({ userId, purpose: "studio" }),
      }),
    });
    return NextResponse.json(json);
  } catch (error) {
    console.error("studio upload token", error);
    return NextResponse.json({ error: "No pudimos preparar la subida." }, { status: 400 });
  }
}
