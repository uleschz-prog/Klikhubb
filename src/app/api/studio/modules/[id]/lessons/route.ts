import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { addStudioLesson, StudioError } from "@/lib/commerce/studio";
import { createLessonSchema } from "@/lib/validations/studio";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createLessonSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Revisa la lección.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const lesson = await addStudioLesson(userId, params.id, parsed.data);
    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    if (error instanceof StudioError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("add studio lesson", error);
    return NextResponse.json({ error: "No se pudo crear la lección." }, { status: 500 });
  }
}
