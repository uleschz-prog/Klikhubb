import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { contractMarkdownToPdf } from "@/lib/pdf";
import { getVerifiedPaymentFromCookie } from "@/lib/payments";
import { requireApiUser } from "@/lib/supabase/require-api-user";
import { MercadoPagoNotConfiguredError } from "@/lib/mercadopago";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  try {
    const payment = await getVerifiedPaymentFromCookie();
    if (!payment) {
      return NextResponse.json(
        {
          error:
            "El PDF se desbloquea al liquidar $499.00 MXN con MercadoPago.",
        },
        { status: 402 }
      );
    }

    const body = (await request.json()) as { markdown?: string };
    const markdown = body.markdown?.trim();
    if (!markdown) {
      return NextResponse.json(
        { error: "Falta el Markdown del contrato." },
        { status: 400 }
      );
    }

    const pdf = await contractMarkdownToPdf(markdown);
    return new NextResponse(Uint8Array.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="contrato-arrendamiento-rentasseguras.pdf"',
        "X-Payment-Id": payment.id,
      },
    });
  } catch (error) {
    if (error instanceof MercadoPagoNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const message =
      error instanceof Error ? error.message : "No se pudo armar el PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
