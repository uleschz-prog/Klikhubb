import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { AdminManualPaymentActions } from "@/components/admin/AdminManualPaymentActions";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { listPendingManualPayments } from "@/lib/commerce/manual-payments";
import { formatMoney } from "@/lib/commerce/split";
import { formatWalletDate } from "@/lib/commerce/wallet";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Esperando comprobante";
    case "PROOF_SUBMITTED":
      return "Comprobante enviado";
    default:
      return status;
  }
}

export default async function AdminPaymentsPage() {
  await requireAdminPage();
  const payments = await listPendingManualPayments();

  return (
    <PlatformShell title="Admin">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Operaciones</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Pagos por transferencia</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/55">
        Los compradores transfieren por SPEI y suben comprobante. Aprueba cada pago para abrir el acceso al curso
        y repartir comisiones 85/10/5.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/dashboard" className="font-semibold text-klik-cyan hover:underline">
          Dashboard
        </Link>
        <Link href="/admin/setup" className="font-semibold text-klik-cyan hover:underline">
          Configuración
        </Link>
        <Link href="/admin/payouts" className="font-semibold text-klik-cyan hover:underline">
          Retiros manuales
        </Link>
      </div>

      {payments.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">No hay pagos pendientes</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
            Cuando alguien inicie una compra por transferencia, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col gap-4 rounded-2xl border border-klik-line bg-klik-card px-5 py-4 md:flex-row md:items-start md:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-extrabold text-klik-green">
                  {formatMoney(payment.amount, payment.currency)}
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {payment.product.title} · ref{" "}
                  <span className="font-mono text-white">{payment.reference}</span>
                </p>
                <p className="mt-1 text-sm text-white/60">
                  {payment.buyer.displayName ?? payment.buyer.username ?? "Comprador"} ·{" "}
                  {payment.buyer.email ?? payment.buyer.id}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {statusLabel(payment.status)} · {formatWalletDate(payment.createdAt)}
                </p>
                {payment.proofNote ? (
                  <p className="mt-2 text-sm text-white/55">Nota: {payment.proofNote}</p>
                ) : null}
                {payment.proofUrl ? (
                  <a
                    href={payment.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-klik-cyan hover:underline"
                  >
                    Ver comprobante
                  </a>
                ) : null}
              </div>
              <AdminManualPaymentActions requestId={payment.id} status={payment.status} />
            </div>
          ))}
        </div>
      )}
    </PlatformShell>
  );
}
