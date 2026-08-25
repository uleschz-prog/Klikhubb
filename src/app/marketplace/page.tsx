import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { MarketplaceShop } from "@/components/commerce/MarketplaceShop";
import { listCatalogProducts } from "@/lib/commerce/catalog";
import { getSession } from "@/lib/auth/session";
import { isStripeEnabled } from "@/lib/commerce/stripe";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const [products, session] = await Promise.all([listCatalogProducts(), getSession()]);

  return (
    <PlatformShell title="Marketplace">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Comercio</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Marketplace</h1>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        Cursos, digitales, membresías y físicos. Cada producto puede vivir dentro de un video.
      </p>
      <MarketplaceShop products={products} signedIn={Boolean(session?.user)} stripeEnabled={isStripeEnabled()} />
      <Link href="/feed" className="mt-8 inline-block text-sm text-klik-cyan">
        Ver productos dentro del feed →
      </Link>
    </PlatformShell>
  );
}