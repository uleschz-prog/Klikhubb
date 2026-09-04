import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { AdminCreatorPlanActions } from "@/components/admin/AdminCreatorPlanActions";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { listPendingCreatorPlanInvoices } from "@/lib/commerce/creator-plan-billing";
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

export default async function AdminCreatorPlansPage() {
  await requireAdminPage();
  const invoices = await listPendingCreatorPlanInvoices();

  return (
    <PlatformShell title="Admin">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Operaciones</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Planes mensuales</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/55">
        Facturas SPEI del plan flat $25/mes. Al aprobar se activan 30 días sin comisión de plataforma.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/payments" className="font-semibold text-klik-cyan hover:underline">
          Pagos de cursos
        </Link>
        <Link href="/dashboard" className="font-semibold text-klik-cyan hover:underline">
          Dashboard
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">Sin facturas pendientes</h2>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-col gap-4 rounded-2xl border border-klik-line bg-klik-card px-5 py-4 md:flex-row md:items-start md:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-extrabold text-klik-green">
                  {formatMoney(invoice.amount, invoice.currency)}
                </p>
                <p className="mt-1 text-sm text-white/80">
                  Plan mensual · ref <span className="font-mono text-white">{invoice.reference}</span>
                </p>
                <p className="mt-1 text-sm text-white/60">
                  {invoice.user.displayName ?? invoice.user.username ?? "Creador"} ·{" "}
                  {invoice.user.email ?? invoice.user.id}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {statusLabel(invoice.status)} · {formatWalletDate(invoice.createdAt)}
                </p>
                {invoice.proofNote ? (
                  <p className="mt-2 text-sm text-white/55">Nota: {invoice.proofNote}</p>
                ) : null}
                {invoice.proofUrl ? (
                  <a
                    href={invoice.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-klik-cyan hover:underline"
                  >
                    Ver comprobante
                  </a>
                ) : null}
              </div>
              <AdminCreatorPlanActions invoiceId={invoice.id} status={invoice.status} />
            </div>
          ))}
        </div>
      )}
    </PlatformShell>
  );
}
