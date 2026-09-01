import { notFound, redirect } from "next/navigation";
import { CheckoutStage } from "@/components/commerce/CheckoutStage";
import { getDbUserId, getSession } from "@/lib/auth/session";
import { getCheckoutPreview } from "@/lib/commerce/catalog";
import { isLivePaymentsRequired, isManualPaymentsConfigured } from "@/config/payment-instructions";

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

  const preview = await getCheckoutPreview(params.slug, buyerId);
  if (!preview) notFound();

  const manualPaymentsEnabled = isLivePaymentsRequired() && isManualPaymentsConfigured();

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
      manualPaymentsEnabled={manualPaymentsEnabled}
      canceled={searchParams.canceled === "1"}
    />
  );
}
