import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbUserId } from "@/lib/auth/session";
import { RefundError, requestBuyerCourseRefund } from "@/lib/commerce/refunds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  orderId: z.string().min(8).max(64),
});

export async function POST(request: Request) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para pedir la devolución." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Pedido no válido." }, { status: 400 });
  }

  try {
    const result = await requestBuyerCourseRefund(userId, parsed.data.orderId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RefundError) {
      const status =
        error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : error.code === "STRIPE_FAILED" ? 502 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo pedir la devolución." }, { status: 500 });
  }
}
