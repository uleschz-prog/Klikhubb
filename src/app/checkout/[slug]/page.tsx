import { notFound } from "next/navigation";
import { CheckoutStage } from "@/components/commerce/CheckoutStage";
import { getSession } from "@/lib/auth/session";
import { getCheckoutPreview } from "@/lib/commerce/catalog";
import { isStripeEnabled } from "@/lib/commerce/stripe";

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
    <CheckoutStage
      item={{
        slug: preview.product.slug,
        title: preview.product.title,
        price: preview.product.price,
        currency: preview.product.currency,
        description: preview.product.description,
        type: preview.product.type,
        creatorName: preview.product.creatorName,
      }}
      signedIn
      stripeEnabled={isStripeEnabled()}
      canceled={searchParams.canceled === "1"}
    />
  );
}