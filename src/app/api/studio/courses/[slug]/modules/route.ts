import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { addStudioModule, StudioError } from "@/lib/commerce/studio";
import { createModuleSchema } from "@/lib/validations/studio";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createModuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ponle nombre al módulo." }, { status: 400 });
  }

  try {
    const mod = await addStudioModule(userId, params.slug, parsed.data.title);
    return NextResponse.json({ module: mod }, { status: 201 });
  } catch (error) {
    if (error instanceof StudioError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("add studio module", error);
    return NextResponse.json({ error: "No se pudo crear el módulo." }, { status: 500 });
  }
}
