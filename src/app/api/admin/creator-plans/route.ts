import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin";
import { getDbUserId } from "@/lib/auth/session";
import {
  approveCreatorPlanInvoice,
  CreatorPlanError,
  listPendingCreatorPlanInvoices,
  rejectCreatorPlanInvoice,
} from "@/lib/commerce/creator-plan-billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const invoices = await listPendingCreatorPlanInvoices();
  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const reviewerId = await getDbUserId();
  if (!reviewerId) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as
    | { action?: string; invoiceId?: string; note?: string }
    | null;

  if (!body?.invoiceId) {
    return NextResponse.json({ error: "Falta invoiceId." }, { status: 400 });
  }

  try {
    if (body.action === "approve") {
      const snapshot = await approveCreatorPlanInvoice({
        invoiceId: body.invoiceId,
        reviewerId,
        note: body.note,
      });
      return NextResponse.json({ ok: true, snapshot });
    }
    if (body.action === "reject") {
      await rejectCreatorPlanInvoice({
        invoiceId: body.invoiceId,
        reviewerId,
        note: body.note ?? "",
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  } catch (error) {
    if (error instanceof CreatorPlanError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo procesar la factura." }, { status: 500 });
  }
}
