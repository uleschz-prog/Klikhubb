import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth/session";
import { updateUserAvatar } from "@/lib/profile/avatar";
import { avatarUpdateSchema } from "@/lib/validations/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para cambiar tu foto." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = avatarUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "URL de foto inválida." }, { status: 400 });
  }

  const imageUrl = parsed.data.imageUrl ?? null;
  try {
    const result = await updateUserAvatar(userId, imageUrl);
    return NextResponse.json({ ok: true, imageUrl: result.image, mode: result.mode });
  } catch {
    return NextResponse.json({ error: "No pudimos guardar tu foto." }, { status: 500 });
  }
}
