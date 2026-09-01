import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getDbUserId } from "@/lib/auth/session";
import { isBlobConfigured } from "@/lib/video/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/*", "application/pdf"];

export async function POST(request: Request) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para subir el comprobante." }, { status: 401 });
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
        maximumSizeInBytes: 8 * 1024 * 1024,
        addRandomSuffix: true,
        cacheControlMaxAge: 60 * 60 * 24 * 365,
        tokenPayload: JSON.stringify({ userId, purpose: "payment-proof" }),
      }),
    });
    return NextResponse.json(json);
  } catch (error) {
    console.error("payment proof upload token", error);
    return NextResponse.json({ error: "No pudimos preparar la subida." }, { status: 400 });
  }
}
