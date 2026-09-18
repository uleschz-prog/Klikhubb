import { notFound, redirect } from "next/navigation";
import { CheckoutStage } from "@/components/commerce/CheckoutStage";
import { getDbUserId, getSession } from "@/lib/auth/session";
import { getCheckoutPreview, viewerOwnsProduct } from "@/lib/commerce/catalog";
import { getCheckoutMethods } from "@/config/checkout-methods";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { canceled?: string };
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout/${params.slug}`)}`);
  }

  const buyerId = await getDbUserId();
  if (!buyerId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout/${params.slug}`)}`);
  }

  if (await viewerOwnsProduct(buyerId, params.slug)) {
    redirect(`/learn/${params.slug}`);
  }

  const preview = await getCheckoutPreview(params.slug);
  if (!preview) notFound();

  const methods = getCheckoutMethods();

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
      stripeEnabled={methods.stripe}
      speiEnabled={methods.spei}
      canceled={searchParams.canceled === "1"}
      cancelPath={`/c/${params.slug}`}
    />
  );
}
