import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { AdminPayoutActions } from "@/components/admin/AdminPayoutActions";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { listPendingManualPayouts } from "@/lib/commerce/admin-payouts";
import { formatMoney } from "@/lib/commerce/split";
import { formatWalletDate } from "@/lib/commerce/wallet";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  await requireAdminPage();
  const payouts = await listPendingManualPayouts();

  return (
    <PlatformShell title="Admin">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Operaciones</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Retiros manuales</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/55">
        Cuando Stripe Connect no está activo, los creadores piden retiro y tú transfieres el dinero por fuera
        (SPEI, PayPal, etc.). Marca cada retiro como pagado cuando lo hayas enviado.
      </p>

      <div className="mt-4">
        <Link href="/dashboard" className="text-sm font-semibold text-klik-cyan hover:underline">
          Volver al dashboard
        </Link>
      </div>

      {payouts.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">No hay retiros pendientes</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
            Cuando alguien pida retiro sin Connect, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {payouts.map((payout) => (
            <div
              key={payout.id}
              className="flex flex-col gap-4 rounded-2xl border border-klik-line bg-klik-card px-5 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-display text-xl font-extrabold text-klik-green">
                  {formatMoney(payout.amount, payout.currency)}
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {payout.user.displayName ?? payout.user.username ?? "Usuario"} ·{" "}
                  {payout.user.email ?? payout.user.username ?? payout.user.id}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Solicitado {formatWalletDate(payout.createdAt)} · ID {payout.id.slice(0, 8)}…
                </p>
              </div>
              <AdminPayoutActions payoutId={payout.id} />
            </div>
          ))}
        </div>
      )}
    </PlatformShell>
  );
}
