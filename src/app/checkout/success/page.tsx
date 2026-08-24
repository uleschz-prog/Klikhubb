import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { fulfillCheckoutSession, isStripeEnabled } from "@/lib/commerce/stripe";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string; session_id?: string };
}) {
  let orderRef = searchParams.order ?? null;
  let unpaid = false;
  let alreadyOwned = false;

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

  const headline = unpaid ? "Estamos confirmando el pago" : "Ya estás dentro";
  const body = unpaid
    ? "Stripe aún no confirmó el pago. En cuanto lo haga, entras a la academia y a la comunidad."
    : alreadyOwned
      ? "Este producto ya estaba en tu academy. No se cobró de nuevo."
      : "Ya pagaste. Entras a la academia y a la comunidad. El creador cobra en automático.";

  return (
    <PlatformShell title="Pago">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">
        {unpaid ? "Pago en proceso" : "Pago confirmado"}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{headline}</h1>
      <p className="mt-3 max-w-xl text-sm text-white/60">
        {body}
        {orderRef ? ` Ref ${orderRef}.` : ""}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black"
        >
          Ver mis ganancias
        </Link>
        <Link href="/academy" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">
          Ir a Academy
        </Link>
      </div>
    </PlatformShell>
  );
}
