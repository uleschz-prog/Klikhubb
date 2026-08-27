import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { loadStudioCourse, StudioError, updateStudioCourse } from "@/lib/commerce/studio";
import { updateCourseSchema } from "@/lib/validations/studio";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const course = await loadStudioCourse(userId, params.slug);
  if (!course) return NextResponse.json({ error: "Curso no encontrado." }, { status: 404 });
  return NextResponse.json({ course });
}

export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  try {
    await updateStudioCourse(userId, params.slug, parsed.data);
    const course = await loadStudioCourse(userId, params.slug);
    return NextResponse.json({ course });
  } catch (error) {
    if (error instanceof StudioError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("update studio course", error);
    return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
  }
}
