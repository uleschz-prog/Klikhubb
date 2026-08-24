import { notFound } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { CheckoutForm } from "@/components/commerce/CheckoutForm";
import { getSession } from "@/lib/auth/session";
import { getCheckoutPreview } from "@/lib/commerce/catalog";
import { isStripeEnabled } from "@/lib/commerce/stripe";
import { formatMoney } from "@/lib/commerce/split";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { canceled?: string };
}) {
  const session = await getSession();
  if (!session?.user?.id) notFound();

  const preview = await getCheckoutPreview(params.slug, session.user.id);
  if (!preview) notFound();

  return (
    <PlatformShell title="Checkout">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Checkout</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{preview.product.title}</h1>
      <p className="mt-2 text-sm text-white/55">
        Por {preview.product.creatorName}. Del video a aquí: un clic y ya estás dentro.
      </p>
      {searchParams.canceled === "1" ? (
        <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          El pago se canceló en Stripe. Puedes intentarlo de nuevo cuando quieras.
        </p>
      ) : null}
      <p className="mt-4 font-display text-4xl font-extrabold text-klik-green">
        {formatMoney(preview.product.price, preview.product.currency)}
      </p>
      <div className="mt-8 max-w-lg">
        <CheckoutForm
          slug={preview.product.slug}
          title={preview.product.title}
          price={preview.product.price}
          currency={preview.product.currency}
          stripeEnabled={isStripeEnabled()}
        />
      </div>
    </PlatformShell>
  );
}
