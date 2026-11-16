import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDbUserId, getSession } from "@/lib/auth/session";
import { assertCanPurchase, resolveProduct } from "@/lib/commerce/catalog";
import { CommerceError, settlePaidOrder } from "@/lib/commerce/settle-order";
import {
  createManualPaymentRequest,
  ManualPaymentError,
} from "@/lib/commerce/manual-payments";
import { isLivePaymentsRequired } from "@/config/payment-instructions";
import { getCheckoutMethods, resolveCheckoutIntent } from "@/config/checkout-methods";
import { demoSettleOrder } from "@/lib/demo/store";
import { checkoutSchema } from "@/lib/validations/auth";
import { createCheckoutPreference, MercadoPagoError } from "@/lib/payments/mercadopago";
import { createUsdtPayment, NowPaymentsError } from "@/lib/payments/nowpayments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  const buyerId = await getDbUserId();
  if (!session?.user || !buyerId) {
    return NextResponse.json({ error: "Inicia sesión para comprar." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Producto no válido." }, { status: 400 });
  }

  const slug = parsed.data.slug;
  const method = parsed.data.method;
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

  const methods = getCheckoutMethods();
  const intent = resolveCheckoutIntent(method, methods);

  if (intent === "mercadopago") {
    if (!methods.mercadopago) {
      return NextResponse.json(
        { error: "Mercado Pago aún no está activo. Falta configurar las claves." },
        { status: 503 },
      );
    }
    try {
      const preference = await createCheckoutPreference({
        buyerId,
        productId: product.id,
        title: product.title,
        description: product.description,
        amountUsd: product.price,
        buyerEmail: session.user.email,
        successPath: `/checkout/success?slug=${encodeURIComponent(product.slug)}`,
        failurePath: `/checkout/failure?slug=${encodeURIComponent(product.slug)}`,
        pendingPath: `/checkout/pending?slug=${encodeURIComponent(product.slug)}`,
      });
      return NextResponse.json({
        ok: true,
        mode: "mercadopago",
        preferenceId: preference.id,
        initPoint: preference.initPoint,
        externalReference: preference.externalReference,
        amountUsd: preference.amountUsd,
        amountMxn: preference.amountMxn,
        fxRate: preference.fxRate,
      });
    } catch (error) {
      if (error instanceof MercadoPagoError) {
        const status = error.code === "NOT_CONFIGURED" || error.code === "FX_UNAVAILABLE" ? 503 : 502;
        return NextResponse.json({ error: error.message, code: error.code }, { status });
      }
      console.error(error);
      return NextResponse.json({ error: "No se pudo iniciar el pago con Mercado Pago." }, { status: 500 });
    }
  }


  if (intent === "usdt") {
    if (!methods.usdt) {
      return NextResponse.json(
        { error: "USDT (TRC20) aún no está activo. Falta USDT_ENABLED y las claves de NOWPayments." },
        { status: 503 },
      );
    }
    try {
      const invoice = await createUsdtPayment({
        buyerId,
        productId: product.id,
        title: product.title,
        amountUsd: product.price,
      });
      return NextResponse.json({
        ok: true,
        mode: "usdt",
        paymentId: invoice.paymentId,
        payAddress: invoice.payAddress,
        payAmount: invoice.payAmount,
        payCurrency: invoice.payCurrency,
        priceAmount: invoice.priceAmount,
        priceCurrency: invoice.priceCurrency,
        invoiceId: invoice.invoiceId,
      });
    } catch (error) {
      if (error instanceof NowPaymentsError) {
        const status = error.code === "NOT_CONFIGURED" || error.code === "DISABLED" ? 503 : 502;
        return NextResponse.json({ error: error.message, code: error.code }, { status });
      }
      console.error(error);
      return NextResponse.json({ error: "No se pudo iniciar el pago con USDT." }, { status: 500 });
    }
  }

  if (intent === "spei") {
    if (!methods.spei) {
      return NextResponse.json(
        { error: "Los pagos por transferencia aún no están activos. Falta configurar datos bancarios." },
        { status: 503 },
      );
    }
    try {
      const manual = await createManualPaymentRequest({
        buyerId,
        productId: product.id,
        amount: product.price,
        currency: product.currency,
      });
      return NextResponse.json({
        ok: true,
        mode: "manual",
        requestId: manual.requestId,
        reference: manual.reference,
        amount: manual.amount,
        currency: manual.currency,
        status: manual.status,
        instructions: manual.instructions,
      });
    } catch (error) {
      if (error instanceof ManualPaymentError) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
      }
      console.error(error);
      return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 500 });
    }
  }

  if (isLivePaymentsRequired()) {
    return NextResponse.json(
      { error: "Elige un método de pago. Falta configurar Mercado Pago o los datos SPEI." },
      { status: 503 },
    );
  }

  try {
    if (product.source === "postgres") {
      const settled = await settlePaidOrder({
        buyerId,
        productId: product.id,
        provider: "demo",
        providerRef: `demo_${buyerId}_${product.id}_${randomUUID()}`,
      });
      return NextResponse.json({ ok: true, ...settled, mode: "demo" });
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
    const status = error.code === "ALREADY_OWNED" ? 409 : error.code === "USER_NOT_FOUND" ? 401 : 400;
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
