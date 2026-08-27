import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { createStudioCourse, listStudioCourses, StudioError } from "@/lib/commerce/studio";
import { createCourseSchema } from "@/lib/validations/studio";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const courses = await listStudioCourses(userId);
  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa título y precio." }, { status: 400 });
  }

  try {
    const course = await createStudioCourse(userId, parsed.data);
    return NextResponse.json({ slug: course.slug }, { status: 201 });
  } catch (error) {
    if (error instanceof StudioError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("create studio course", error);
    return NextResponse.json({ error: "No se pudo crear el curso." }, { status: 500 });
  }
}
