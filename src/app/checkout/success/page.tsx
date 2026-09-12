import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { fulfillCheckoutSession, isStripeEnabled } from "@/lib/commerce/stripe";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string; session_id?: string; pending?: string };
}) {
  let orderRef = searchParams.order ?? null;
  let unpaid = false;
  let alreadyOwned = false;
  const pending = searchParams.pending === "1";

  if (searchParams.session_id && isStripeEnabled()) {
    try {
      const result = await fulfillCheckoutSession(searchParams.session_id);
      unpaid = result.unpaid;
      alreadyOwned = result.alreadyOwned;
      if (result.settled?.orderId) {
        orderRef = result.settled.orderId;
      }
    } catch {
      unpaid = true;
    }
  }

  const headline = pending
    ? "Comprobante recibido"
    : unpaid
      ? "Estamos confirmando el pago"
      : "Ya estás dentro";
  const body = pending
    ? "Revisaremos tu transferencia pronto. Cuando la confirmemos, te avisamos aquí y por email, y el curso aparece en Mis cursos."
    : unpaid
      ? "Stripe aún no confirmó el pago. En cuanto lo haga, el curso aparece en tu academy."
      : alreadyOwned
        ? "Este producto ya estaba en tu academy. No se cobró de nuevo."
        : "Ya pagaste. El curso quedó en Mis cursos. El creador ve el dinero en el monedero, pendiente 14 días.";

  return (
    <PlatformShell title="Pago">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">
        {pending ? "Pago en revisión" : unpaid ? "Pago en proceso" : "Pago confirmado"}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{headline}</h1>
      <p className="mt-3 max-w-xl text-sm text-white/60">
        {body}
        {orderRef ? ` Ref ${orderRef}.` : ""}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/academy"
          className="rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black"
        >
          Ver mis cursos
        </Link>
        <Link href="/orders" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">
          Ver mis pedidos
        </Link>
      </div>
    </PlatformShell>
  );
}
