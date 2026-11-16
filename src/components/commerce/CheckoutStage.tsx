"use client";

import { useRouter } from "next/navigation";
import { BuyDrawer, type BuyItem } from "@/components/commerce/BuyDrawer";
import { Logo } from "@/components/brand/Logo";

export function CheckoutStage({
  item,
  signedIn,
  mercadoPagoEnabled,
  speiEnabled,
  amountMxn,
  fxRate,
  canceled,
  cancelPath,
}: {
  item: BuyItem;
  signedIn: boolean;
  mercadoPagoEnabled: boolean;
  speiEnabled: boolean;
  amountMxn?: number;
  fxRate?: number;
  canceled?: boolean;
  cancelPath?: string;
}) {
  const router = useRouter();
  const closeTo = "/feed";
  const backPath = cancelPath ?? `/c/${item.slug}`;

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
        mercadoPagoEnabled={mercadoPagoEnabled}
        speiEnabled={speiEnabled}
        amountMxn={amountMxn}
        fxRate={fxRate}
        loginHref={`/login?callbackUrl=${encodeURIComponent(`/checkout/${item.slug}`)}`}
        cancelPath={backPath}
        canceled={canceled}
      />
    </div>
  );
}
