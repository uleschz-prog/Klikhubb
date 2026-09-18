import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { getDbUserId } from "@/lib/auth/session";
import { fulfillCheckoutSession, isStripeEnabled } from "@/lib/commerce/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function slugFromOrder(orderId: string, buyerId: string | null) {
  if (!buyerId) return null;
  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId },
      select: { items: { take: 1, select: { product: { select: { slug: true, title: true } } } } },
    });
    return {
      slug: order?.items[0]?.product.slug ?? null,
      title: order?.items[0]?.product.title ?? null,
    };
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string; session_id?: string; pending?: string; slug?: string };
}) {
  let orderRef = searchParams.order ?? null;
  let unpaid = false;
  let alreadyOwned = false;
  let settleFailed = false;
  const pending = searchParams.pending === "1";
  let productSlug = searchParams.slug?.trim() || null;
  let productTitle: string | null = null;

  const userId = await getDbUserId();

  if (searchParams.session_id && isStripeEnabled()) {
    try {
      const result = await fulfillCheckoutSession(searchParams.session_id);
      unpaid = result.unpaid;
      alreadyOwned = result.alreadyOwned;
      if (result.settled?.orderId) {
        orderRef = result.settled.orderId;
      }
      productSlug = result.productSlug ?? result.settled?.productSlug ?? productSlug;
      productTitle = result.settled?.productTitle ?? productTitle;
    } catch {
      settleFailed = true;
    }
  }

  if (productSlug == null && orderRef && !pending) {
    const fromOrder = await slugFromOrder(orderRef, userId);
    productSlug = fromOrder?.slug ?? productSlug;
    productTitle = fromOrder?.title ?? productTitle;
  }

  const courseHref = productSlug ? `/learn/${productSlug}` : "/cursos";
  const fichaHref = productSlug ? `/c/${productSlug}` : "/cursos";
  const startLabel = alreadyOwned ? "Ir al curso" : "Empezar el curso";

  const headline = pending
    ? "Comprobante recibido"
    : settleFailed
      ? "No pudimos confirmar el acceso"
      : unpaid
        ? "Estamos confirmando el pago"
        : "Ya estás dentro";
  const body = pending
    ? "Revisaremos tu transferencia pronto. Cuando la confirmemos, te avisamos aquí y por email, y el curso aparece en Mis cursos."
    : settleFailed
      ? "El cargo puede estar bien, pero el acceso no se asentó. Escribe a soporte con el id de la sesión de Stripe."
      : unpaid
        ? "Stripe aún no confirmó el pago. En cuanto lo haga, el curso aparece en Mis cursos."
        : alreadyOwned
          ? "Este producto ya estaba en tus cursos. No se cobró de nuevo."
          : productTitle
            ? `Ya pagaste ${productTitle}. Entra a la primera lección. Tienes 24 horas para pedir la devolución desde Mis pedidos.`
            : "Ya pagaste. Entra al curso. Tienes 24 horas para pedir la devolución desde Mis pedidos.";

  return (
    <PlatformShell title="Pago">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">
        {pending ? "Pago en revisión" : settleFailed ? "Hay un problema" : unpaid ? "Pago en proceso" : "Pago confirmado"}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{headline}</h1>
      <p className="mt-3 max-w-xl text-sm text-white/60">
        {body}
        {orderRef ? ` Ref ${orderRef}.` : ""}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {pending ? (
          <Link
            href={fichaHref}
            className="rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black"
          >
            Ver la ficha
          </Link>
        ) : settleFailed || unpaid ? (
          <Link
            href="/cursos"
            className="rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black"
          >
            Ver mis cursos
          </Link>
        ) : (
          <Link
            href={courseHref}
            className="rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black"
          >
            {startLabel}
          </Link>
        )}
        <Link href="/orders" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">
          Ver mis pedidos
        </Link>
      </div>
    </PlatformShell>
  );
}
