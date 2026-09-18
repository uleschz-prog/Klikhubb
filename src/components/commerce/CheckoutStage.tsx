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
  cancelPath,
}: {
  item: BuyItem;
  signedIn: boolean;
  stripeEnabled: boolean;
  speiEnabled: boolean;
  canceled?: boolean;
  cancelPath?: string;
}) {
  const router = useRouter();
  const closeTo = "/feed";
  const stripeCancel = cancelPath ?? `/c/${item.slug}`;

  return (
    <div className="relative min-h-[100dvh] bg-background">
      <header className="absolute left-4 top-4 z-10">
        <Logo href={closeTo} className="text-foreground" />
      </header>
      <BuyDrawer
        open
        onClose={() => router.push(closeTo)}
        item={item}
        signedIn={signedIn}
        stripeEnabled={stripeEnabled}
        speiEnabled={speiEnabled}
        loginHref={`/login?callbackUrl=${encodeURIComponent(`/checkout/${item.slug}`)}`}
        cancelPath={stripeCancel}
        canceled={canceled}
      />
    </div>
  );
}
