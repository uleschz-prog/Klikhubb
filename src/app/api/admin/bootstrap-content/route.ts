import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin";
import { bootstrapFirstContent, getFirstContentStatus } from "@/lib/platform/first-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Estado del primer contenido real (curso + feeds Shop/Play). */
export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const status = await getFirstContentStatus();
  return NextResponse.json(status);
}

/** Publica curso oficial y clips iniciales (idempotente). */
export async function POST() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const result = await bootstrapFirstContent();
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "No se pudo publicar el contenido inicial.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
