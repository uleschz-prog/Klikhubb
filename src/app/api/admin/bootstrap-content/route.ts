import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin";
import { bootstrapFirstContent, getFirstContentStatus } from "@/lib/platform/first-content";
import { getLaunchCourseStatus, publishLaunchCourse } from "@/lib/platform/launch-course";
import { purgePlaceholderFeedContent } from "@/lib/platform/purge-placeholders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Estado del contenido bootstrap (curso en Studio; sin clips fake en el feed). */
export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const [status, launch] = await Promise.all([getFirstContentStatus(), getLaunchCourseStatus()]);
  return NextResponse.json({ ...status, launch });
}

/**
 * POST body opcional:
 * - { action: "purge" } → elimina videos/cursos placeholder del feed
 * - { action: "publish-launch" } → lecciones + preview + clip Shop de Cierre Qlyk
 * - sin body / action bootstrap → crea curso borrador Empieza en Qlyk (sin clips al feed)
 */
export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as { action?: string } | null;

  try {
    if (body?.action === "purge") {
      const result = await purgePlaceholderFeedContent();
      const [status, launch] = await Promise.all([getFirstContentStatus(), getLaunchCourseStatus()]);
      return NextResponse.json({ ok: true, purge: result, ...status, launch });
    }

    if (body?.action === "publish-launch") {
      const launch = await publishLaunchCourse();
      const status = await getFirstContentStatus();
      return NextResponse.json({ ok: true, ...status, launch });
    }

    const result = await bootstrapFirstContent();
    const launch = await getLaunchCourseStatus();
    return NextResponse.json({ ...result, launch });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "No se pudo procesar la acción de contenido.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
