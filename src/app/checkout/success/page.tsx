import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { MercadoPagoReturnConfirm } from "@/components/commerce/MercadoPagoReturnConfirm";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: {
    order?: string;
    pending?: string;
    payment_id?: string;
    collection_id?: string;
    status?: string;
    collection_status?: string;
  };
}) {
  const orderRef = searchParams.order ?? null;
  const pending = searchParams.pending === "1";
  const paymentId =
    searchParams.payment_id && searchParams.payment_id !== "null"
      ? searchParams.payment_id
      : searchParams.collection_id && searchParams.collection_id !== "null"
        ? searchParams.collection_id
        : null;
  const mpStatus = (searchParams.status || searchParams.collection_status || "").toLowerCase();
  const awaitingMp = Boolean(paymentId) && !orderRef && !pending;

  const headline = pending
    ? "Comprobante recibido"
    : awaitingMp
      ? "Confirmando tu pago"
      : "Ya estás dentro";
  const body = pending
    ? "Revisaremos tu transferencia pronto. Cuando la confirmemos, te avisamos aquí y por email, y el curso aparece en Academy."
    : awaitingMp
      ? "Mercado Pago nos devolvió al sitio. Estamos activando tu acceso."
      : "Ya pagaste. El curso quedó en tu academy. El creador ve el dinero en el monedero, pendiente 14 días.";

  return (
    <PlatformShell title="Pago">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">
        {pending ? "Pago en revisión" : awaitingMp ? "Mercado Pago" : "Pago confirmado"}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{headline}</h1>
      <p className="mt-3 max-w-xl text-sm text-white/60">
        {body}
        {orderRef ? ` Ref ${orderRef}.` : ""}
        {mpStatus && awaitingMp ? ` Estado: ${mpStatus}.` : ""}
      </p>
      {awaitingMp ? <MercadoPagoReturnConfirm paymentId={paymentId} /> : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/academy"
          className="rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black"
        >
          Ir a Academy
        </Link>
        <Link href="/orders" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">
          Ver mis pedidos
        </Link>
        <Link href="/notifications" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">
          Avisos
        </Link>
      </div>
    </PlatformShell>
  );
}
