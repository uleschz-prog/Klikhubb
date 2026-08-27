import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import {
  deleteStudioLesson,
  moveStudioLesson,
  StudioError,
  updateStudioLesson,
} from "@/lib/commerce/studio";
import { updateLessonSchema } from "@/lib/validations/studio";
import { z } from "zod";

export const dynamic = "force-dynamic";

const moveSchema = z.object({
  direction: z.enum(["up", "down"]),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);

  const move = moveSchema.safeParse(body);
  if (move.success) {
    try {
      await moveStudioLesson(userId, params.id, move.data.direction);
      return NextResponse.json({ ok: true });
    } catch (error) {
      if (error instanceof StudioError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error("move studio lesson", error);
      return NextResponse.json({ error: "No se pudo reordenar." }, { status: 500 });
    }
  }

  const parsed = updateLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  try {
    const lesson = await updateStudioLesson(userId, params.id, parsed.data);
    return NextResponse.json({ lesson });
  } catch (error) {
    if (error instanceof StudioError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("update studio lesson", error);
    return NextResponse.json({ error: "No se pudo guardar la lección." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  try {
    await deleteStudioLesson(userId, params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof StudioError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("delete studio lesson", error);
    return NextResponse.json({ error: "No se pudo borrar la lección." }, { status: 500 });
  }
}
