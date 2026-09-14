"use client";

import { useRouter } from "next/navigation";
import { BuyDrawer, type BuyItem } from "@/components/commerce/BuyDrawer";
import { Logo } from "@/components/brand/Logo";

export function CheckoutStage({
  item,
  signedIn,
  stripeEnabled,
  speiEnabled,
  canceled,
}: {
  item: BuyItem;
  signedIn: boolean;
  stripeEnabled: boolean;
  speiEnabled: boolean;
  canceled?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="relative min-h-[100dvh] bg-background">
      <header className="absolute left-4 top-4 z-10">
        <Logo href="/feed" className="text-foreground" />
      </header>
      <BuyDrawer
        open
        onClose={() => router.push("/feed")}
        item={item}
        signedIn={signedIn}
        stripeEnabled={stripeEnabled}
        speiEnabled={speiEnabled}
        loginHref={`/login?callbackUrl=${encodeURIComponent(`/checkout/${item.slug}`)}`}
        cancelPath={`/c/${item.slug}`}
        canceled={canceled}
      />
    </div>
  );
}
