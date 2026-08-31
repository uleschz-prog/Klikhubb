"use client";

import { useMemo, useState } from "react";
import type { CatalogProduct } from "@/lib/commerce/catalog";
import { BuyButton } from "@/components/commerce/BuyButton";
import { BuyDrawer, type BuyItem } from "@/components/commerce/BuyDrawer";

export function MarketplaceShop({
  products,
  signedIn,
  stripeEnabled,
}: {
  products: CatalogProduct[];
  signedIn: boolean;
  stripeEnabled: boolean;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  const selected = useMemo(() => products.find((item) => item.slug === slug) ?? null, [products, slug]);
  const item: BuyItem | null = selected
    ? {
        slug: selected.slug,
        title: selected.title,
        price: selected.price,
        currency: selected.currency,
        description: selected.description,
        type: selected.type,
        billing: selected.billing,
      }
    : null;

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article key={product.slug} className="rounded-2xl border border-klik-line bg-klik-card p-5">
            <p className="text-[11px] uppercase tracking-wider text-white/40">
              {product.type}
              {product.billing === "MONTHLY" ? " · Suscripción mensual" : ""}
            </p>
            <h2 className="mt-2 font-display text-xl font-bold">{product.title}</h2>
            {product.description ? <p className="mt-2 text-sm text-white/50">{product.description}</p> : null}
            <div className="mt-6">
              <BuyButton
                price={product.price}
                currency={product.currency}
                billing={product.billing}
                onClick={() => setSlug(product.slug)}
              />
            </div>
          </article>
        ))}
      </div>
      <BuyDrawer
        open={Boolean(item)}
        onClose={() => setSlug(null)}
        item={item}
        signedIn={signedIn}
        stripeEnabled={stripeEnabled}
        loginHref={`/login?callbackUrl=${encodeURIComponent("/marketplace")}`}
        cancelPath="/marketplace"
      />
    </>
  );
}
