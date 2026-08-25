import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth/session";
import { assertCanPurchase, resolveProduct } from "@/lib/commerce/catalog";
import { createStripeCheckoutSession, isStripeEnabled } from "@/lib/commerce/stripe";
import { CommerceError, settlePaidOrder } from "@/lib/commerce/settle-order";
import { demoSettleOrder } from "@/lib/demo/store";
import { checkoutSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Inicia sesión para comprar." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Producto no válido." }, { status: 400 });
  }

  const slug = parsed.data.slug;
  const buyerId = session.user.id;
  const product = await resolveProduct(slug);
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  try {
    await assertCanPurchase(buyerId, product);
  } catch (error) {
    const mapped = mapCommerceError(error);
    if (mapped) return mapped;
    console.error(error);
    return NextResponse.json({ error: "No se pudo validar la compra." }, { status: 500 });
  }

  if (isStripeEnabled()) {
    try {
      const checkout = await createStripeCheckoutSession({
        buyerId,
        buyerEmail: session.user.email,
        product,
        cancelPath: parsed.data.cancelPath,
      });
      if (!checkout.url) {
        return NextResponse.json({ error: "Stripe no devolvió una URL de pago." }, { status: 502 });
      }
      return NextResponse.json({ ok: true, url: checkout.url, mode: "stripe" });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "No se pudo abrir Stripe Checkout." }, { status: 502 });
    }
  }

  try {
    if (product.source === "postgres") {
      const settled = await settlePaidOrder({
        buyerId,
        productId: product.id,
        provider: "demo",
        providerRef: `demo_${buyerId}_${product.id}_${randomUUID()}`,
      });
      return NextResponse.json({ ok: true, ...settled, mode: "postgres" });
    }
    const settled = await demoSettleOrder({ buyerId, slug });
    return NextResponse.json({ ok: true, ...settled, mode: "demo" });
  } catch (error) {
    const mapped = mapCommerceError(error);
    if (mapped) return mapped;
    console.error(error);
    return NextResponse.json({ error: "No se pudo completar el pago." }, { status: 500 });
  }
}

function mapCommerceError(error: unknown) {
  if (error instanceof CommerceError) {
    const status = error.code === "ALREADY_OWNED" ? 409 : 400;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  const code = error instanceof Error ? error.message : "";
  if (code === "ALREADY_OWNED") {
    return NextResponse.json({ error: "Ya tienes este producto.", code }, { status: 409 });
  }
  if (code === "SELF_PURCHASE") {
    return NextResponse.json({ error: "No puedes comprar tu propio producto.", code }, { status: 400 });
  }
  if (code === "PRODUCT_UNAVAILABLE") {
    return NextResponse.json({ error: "Este producto no está disponible.", code }, { status: 404 });
  }
  return null;
}
