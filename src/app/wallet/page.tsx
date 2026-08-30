import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { WalletConnectCard } from "@/components/wallet/WalletConnectCard";
import { WalletPayoutForm } from "@/components/wallet/WalletPayoutForm";
import { getDbUserId } from "@/lib/auth/session";
import { formatMoney } from "@/lib/commerce/split";
import { loadConnectStatus, syncConnectAccount } from "@/lib/commerce/stripe-connect";
import { formatWalletDate, ledgerLabel, loadWalletView } from "@/lib/commerce/wallet";

export const dynamic = "force-dynamic";

function payoutStatus(status: string) {
  switch (status) {
    case "PENDING":
      return "En revisión";
    case "PROCESSING":
      return "En camino";
    case "COMPLETED":
      return "Depositado";
    case "FAILED":
      return "No se pudo";
    default:
      return status;
  }
}

export default async function WalletPage({
  searchParams,
}: {
  searchParams: { connect?: string };
}) {
  const userId = await getDbUserId();
  if (!userId) {
    redirect("/login?callbackUrl=/wallet");
  }

  if (searchParams.connect === "return" || searchParams.connect === "refresh") {
    await syncConnectAccount(userId);
  }

  const connectNotice =
    searchParams.connect === "return" ? ("return" as const) : searchParams.connect === "refresh" ? ("refresh" as const) : null;

  const wallet = await loadWalletView(userId);
  const connect = await loadConnectStatus(userId);

  return (
    <PlatformShell title="Monedero">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Tu dinero</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Monedero</h1>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        Cada venta espera {wallet.holdDays} días por si hay un reembolso. Después pasa a disponible y
        puedes pedir el retiro.
        {wallet.demo ? " Modo local: Postgres aún no acepta la conexión." : ""}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-klik-line bg-klik-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Disponible</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-klik-green">
            {formatMoney(wallet.available, wallet.currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-klik-line bg-klik-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-white/40">
            Pendiente ({wallet.holdDays} días)
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-klik-cyan">
            {formatMoney(wallet.pending, wallet.currency)}
          </p>
          {wallet.nextReleaseAt ? (
            <p className="mt-2 text-xs text-white/40">Siguiente: {formatWalletDate(wallet.nextReleaseAt)}</p>
          ) : (
            <p className="mt-2 text-xs text-white/40">Nada en hold ahora</p>
          )}
        </div>
        <div className="rounded-2xl border border-klik-line bg-klik-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Ganado en total</p>
          <p className="mt-2 font-display text-2xl font-extrabold">
            {formatMoney(wallet.lifetimeEarned, wallet.currency)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Link href="/dashboard" className="text-sm font-semibold text-klik-cyan hover:underline">
          Volver al dashboard
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <WalletConnectCard connectNotice={connectNotice} />

        <WalletPayoutForm
          available={wallet.available}
          minPayout={wallet.minPayout}
          currency={wallet.currency}
          connectRequired={connect.enabled}
          connectReady={connect.payoutsEnabled}
        />

        <div className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Hold</p>
          <h2 className="mt-1 font-display text-xl font-bold">Se libera en {wallet.holdDays} días</h2>
          {wallet.holds.length === 0 ? (
            <p className="mt-3 text-sm text-white/55">No hay ventas esperando. Cuando cobres, aparecen aquí.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {wallet.holds.map((hold) => (
                <li
                  key={hold.id}
                  className="flex items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{hold.productTitle}</p>
                    <p className="text-xs text-white/40">
                      {hold.kind === "sale" ? "Tu venta" : "Invitación"} · {formatWalletDate(hold.availableAt)}
                    </p>
                  </div>
                  <p className="font-display text-sm font-bold text-klik-cyan">
                    {formatMoney(hold.amount, wallet.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {wallet.payouts.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Retiros</p>
          <ul className="mt-4 space-y-3">
            {wallet.payouts.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-white/60">
                  {formatWalletDate(row.createdAt)} · {payoutStatus(row.status)}
                </span>
                <span className="font-display font-bold">{formatMoney(row.amount, wallet.currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Movimientos</p>
        {wallet.ledger.length === 0 ? (
          <p className="mt-3 text-sm text-white/55">Todavía no hay movimientos. Una venta los escribe aquí.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {wallet.ledger.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold">{ledgerLabel(row.type)}</p>
                  <p className="text-xs text-white/40">
                    {formatWalletDate(row.createdAt)}
                    {row.note ? ` · ${row.note}` : ""}
                  </p>
                </div>
                <p
                  className={`font-display text-sm font-bold ${
                    row.amount < 0 ? "text-white/70" : "text-klik-green"
                  }`}
                >
                  {row.amount < 0 ? "−" : "+"}
                  {formatMoney(Math.abs(row.amount), wallet.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PlatformShell>
  );
}
