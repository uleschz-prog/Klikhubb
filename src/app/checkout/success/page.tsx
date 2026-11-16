import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { getDbUserId } from "@/lib/auth/session";
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
  searchParams: { order?: string; pending?: string; slug?: string };
}) {
  const orderRef = searchParams.order ?? null;
  const pending = searchParams.pending === "1";
  let productSlug = searchParams.slug?.trim() || null;
  let productTitle: string | null = null;

  const userId = await getDbUserId();

  if (productSlug == null && orderRef && !pending) {
    const fromOrder = await slugFromOrder(orderRef, userId);
    productSlug = fromOrder?.slug ?? productSlug;
    productTitle = fromOrder?.title ?? productTitle;
  }

  const courseHref = productSlug ? `/learn/${productSlug}` : "/cursos";
  const fichaHref = productSlug ? `/c/${productSlug}` : "/cursos";
  const startLabel = "Empezar el curso";

  const headline = pending ? "Comprobante recibido" : "Ya estás dentro";
  const body = pending
    ? "Revisaremos tu transferencia pronto. Cuando la confirmemos, te avisamos aquí y por email, y el curso aparece en Mis cursos."
    : productTitle
      ? `Ya pagaste ${productTitle}. Entra a la primera lección. Tienes 24 horas para pedir la devolución desde Mis pedidos.`
      : "Ya pagaste. Entra al curso. Tienes 24 horas para pedir la devolución desde Mis pedidos.";

  return (
    <PlatformShell title="Pago">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">
        {pending ? "Pago en revisión" : "Pago confirmado"}
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
