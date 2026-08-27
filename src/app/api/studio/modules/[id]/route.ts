import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { deleteStudioModule, StudioError, updateStudioModule } from "@/lib/commerce/studio";
import { updateModuleSchema } from "@/lib/validations/studio";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateModuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  try {
    const mod = await updateStudioModule(userId, params.id, parsed.data);
    return NextResponse.json({ module: mod });
  } catch (error) {
    if (error instanceof StudioError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("update studio module", error);
    return NextResponse.json({ error: "No se pudo guardar el módulo." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  try {
    await deleteStudioModule(userId, params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof StudioError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("delete studio module", error);
    return NextResponse.json({ error: "No se pudo borrar el módulo." }, { status: 500 });
  }
}
