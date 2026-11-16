import { NextResponse } from "next/server";
import { applyNowPaymentsPayoutIpn } from "@/lib/commerce/payouts";
import {
  isNowPaymentsIpnAuthorized,
  isNowPaymentsPayoutPayload,
  settleFromNowPaymentsPayment,
  type NowPaymentsPayment,
} from "@/lib/payments/nowpayments";
import { CommerceError } from "@/lib/commerce/settle-order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const signature = request.headers.get("x-nowpayments-sig");

  if (!isNowPaymentsIpnAuthorized(body, signature)) {
    console.warn("[nowpayments] IPN firma inválida");
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  if (isNowPaymentsPayoutPayload(body)) {
    const rec = body as {
      id?: string;
      batch_withdrawal_id?: string;
      status?: string;
      hash?: string;
    };
    const result = await applyNowPaymentsPayoutIpn({
      batchId: rec.batch_withdrawal_id ? String(rec.batch_withdrawal_id) : null,
      withdrawalId: rec.id != null ? String(rec.id) : null,
      status: rec.status,
      hash: rec.hash,
    });
    return NextResponse.json({ ok: true, kind: "payout", ...result });
  }

  try {
    const result = await settleFromNowPaymentsPayment(body as NowPaymentsPayment);
    return NextResponse.json({ kind: "payment", ...result });
  } catch (error) {
    if (error instanceof CommerceError) {
      return NextResponse.json({ ok: false, code: error.code, error: error.message });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al procesar el IPN" }, { status: 500 });
  }
}
