import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { getDbUserId } from "@/lib/auth/session";
import { listBuyerPurchases } from "@/lib/commerce/buyer-orders";
import { formatMoney } from "@/lib/commerce/split";
import { formatWalletDate } from "@/lib/commerce/wallet";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const userId = await getDbUserId();
  if (!userId) redirect("/login?callbackUrl=/orders");

  const purchases = await listBuyerPurchases(userId);

  return (
    <PlatformShell title="Pedidos">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Compras</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Mis pedidos</h1>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        Aquí ves el estado de tus transferencias SPEI y el acceso a cada curso.
      </p>

      {purchases.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">Aún no has comprado</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
            En el feed Tienda toca Comprar, transfiere y sube tu comprobante.
          </p>
          <Link
            href="/feed"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black"
          >
            Ir al feed
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {purchases.map((row) => (
            <li
              key={`${row.kind}-${row.id}`}
              className="rounded-2xl border border-klik-line bg-klik-card px-5 py-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-display text-lg font-bold">{row.productTitle}</p>
                  <p className="mt-1 text-sm text-klik-cyan">{row.statusLabel}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {formatWalletDate(row.createdAt)}
                    {row.reference ? ` · Ref ${row.reference}` : ""}
                  </p>
                  {row.reviewerNote ? (
                    <p className="mt-2 text-sm text-white/55">Nota: {row.reviewerNote}</p>
                  ) : null}
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-display text-xl font-extrabold text-klik-green">
                    {formatMoney(row.amount, row.currency)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 sm:justify-end">
                    {row.status === "APPROVED" && row.productSlug ? (
                      <Link
                        href={`/academy/${row.productSlug}`}
                        className="rounded-full bg-klik-green px-4 py-2 text-xs font-bold text-klik-black"
                      >
                        Ir a Academy
                      </Link>
                    ) : null}
                    {row.status === "PENDING" || row.status === "PROOF_SUBMITTED" ? (
                      <Link
                        href={row.productSlug ? `/checkout/${row.productSlug}` : "/orders"}
                        className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold"
                      >
                        Ver instrucciones
                      </Link>
                    ) : null}
                    {row.proofUrl ? (
                      <a
                        href={row.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-klik-cyan"
                      >
                        Comprobante
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PlatformShell>
  );
}
