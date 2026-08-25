"use client";

import { useRouter } from "next/navigation";
import { BuyDrawer, type BuyItem } from "@/components/commerce/BuyDrawer";
import { Logo } from "@/components/brand/Logo";

export function CheckoutStage({
  item,
  signedIn,
  stripeEnabled,
  canceled,
}: {
  item: BuyItem;
  signedIn: boolean;
  stripeEnabled: boolean;
  canceled?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="relative min-h-[100dvh] bg-klik-black">
      <header className="absolute left-4 top-4 z-10">
        <Logo href="/feed" />
      </header>
      <BuyDrawer
        open
        onClose={() => router.push("/feed")}
        item={item}
        signedIn={signedIn}
        stripeEnabled={stripeEnabled}
        loginHref={`/login?callbackUrl=${encodeURIComponent(`/checkout/${item.slug}`)}`}
        cancelPath={`/checkout/${item.slug}`}
        canceled={canceled}
      />
    </div>
  );
}