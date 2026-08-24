import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { BuyButton } from "@/components/commerce/BuyButton";
import { listCatalogProducts } from "@/lib/commerce/catalog";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const products = await listCatalogProducts();

  return (
    <PlatformShell title="Marketplace">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Comercio</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Marketplace</h1>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        Cursos, digitales, membresías y físicos. Cada producto puede vivir dentro de un video.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article key={product.slug} className="rounded-2xl border border-klik-line bg-klik-card p-5">
            <p className="text-[11px] uppercase tracking-wider text-white/40">{product.type}</p>
            <h2 className="mt-2 font-display text-xl font-bold">{product.title}</h2>
            <div className="mt-6">
              <BuyButton price={product.price} currency={product.currency} href={`/checkout/${product.slug}`} />
            </div>
          </article>
        ))}
      </div>
      <Link href="/feed" className="mt-8 inline-block text-sm text-klik-cyan">
        Ver productos dentro del feed →
      </Link>
    </PlatformShell>
  );
}
