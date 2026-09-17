import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdminApi } from "@/lib/auth/require-admin";
import { AdminUsersError, listAdminUsers, loadAdminUsersOverview, setAdminUserStatus } from "@/lib/admin/users";
import { forceReleaseCommissions } from "@/lib/commerce/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePlatformAdminApi();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";
  try {
    const [overview, users] = await Promise.all([loadAdminUsersOverview(), listAdminUsers(q || undefined)]);
    return NextResponse.json({ overview, users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo cargar la lista." }, { status: 500 });
  }
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("activate"), userId: z.string().min(1) }),
  z.object({ action: z.literal("deactivate"), userId: z.string().min(1) }),
  z.object({ action: z.literal("releaseUser"), userId: z.string().min(1) }),
  z.object({ action: z.literal("releaseNetwork") }),
]);

export async function POST(request: Request) {
  const auth = await requirePlatformAdminApi();
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  try {
    if (parsed.data.action === "activate") {
      const result = await setAdminUserStatus(parsed.data.userId, "ACTIVE");
      return NextResponse.json({ ok: true, ...result });
    }
    if (parsed.data.action === "deactivate") {
      const result = await setAdminUserStatus(parsed.data.userId, "SUSPENDED");
      return NextResponse.json({ ok: true, ...result });
    }
    if (parsed.data.action === "releaseUser") {
      const result = await forceReleaseCommissions({ userId: parsed.data.userId, unilevelOnly: true });
      return NextResponse.json({ ok: true, ...result });
    }
    const result = await forceReleaseCommissions({ unilevelOnly: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof AdminUsersError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo completar la acción." }, { status: 500 });
  }
}
