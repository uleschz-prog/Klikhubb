import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { getPlatformReadiness } from "@/lib/platform/readiness";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  await requireAdminPage();
  const readiness = getPlatformReadiness();

  return (
    <PlatformShell title="Admin">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Operaciones</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Configuración del beta</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/55">
        Checklist de lo que debe estar listo en Vercel antes de abrir Qlyk al público. Entorno detectado:{" "}
        <span className="font-semibold text-white">{readiness.environment}</span>
        {readiness.stripe.mode ? (
          <>
            {" "}
            · Stripe <span className="font-semibold text-klik-cyan">{readiness.stripe.mode}</span>
          </>
        ) : null}
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/dashboard" className="font-semibold text-klik-cyan hover:underline">
          Dashboard
        </Link>
        <Link href="/admin/payouts" className="font-semibold text-klik-cyan hover:underline">
          Retiros manuales
        </Link>
        <a
          href="/api/stripe/mode"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-klik-cyan hover:underline"
        >
          Diagnóstico Stripe
        </a>
      </div>

      <div
        className={`mt-6 rounded-2xl border px-5 py-4 ${
          readiness.readyForBeta
            ? "border-klik-green/30 bg-klik-green/5"
            : "border-amber-400/30 bg-amber-400/5"
        }`}
      >
        <p className="font-display text-lg font-bold">
          {readiness.readyForBeta ? "Listo para beta (pagos + legal)" : "Faltan pasos antes del beta"}
        </p>
        <p className="mt-1 text-sm text-white/55">
          {readiness.readyForBeta
            ? "Stripe y datos legales configurados. Connect es opcional (retiros manuales funcionan sin él)."
            : "Completa los ítems en rojo en Vercel y redeploy."}
        </p>
      </div>

      <ul className="mt-8 space-y-3">
        {readiness.checks.map((check) => (
          <li
            key={check.id}
            className={`rounded-2xl border px-5 py-4 ${
              check.ok ? "border-klik-green/25 bg-klik-green/5" : "border-white/10 bg-klik-card"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  check.ok ? "bg-klik-green text-klik-black" : "border border-white/20 text-white/40"
                }`}
              >
                {check.ok ? "✓" : "!"}
              </span>
              <div>
                <p className={`font-semibold ${check.ok ? "text-klik-green" : "text-white"}`}>{check.label}</p>
                <p className="mt-1 text-sm text-white/50">{check.hint}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-2xl border border-klik-line bg-klik-card p-5">
        <h2 className="font-display text-lg font-bold">Guías</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/60">
          <li>
            Stripe Live: <code className="text-klik-cyan">docs/stripe-live-vercel.md</code>
          </li>
          <li>
            Identidad legal: <code className="text-klik-cyan">docs/legal-setup-vercel.md</code>
          </li>
          <li>
            Pagos y retiros: <code className="text-klik-cyan">docs/flujo-pagos-y-retiros.md</code>
          </li>
        </ul>
      </section>
    </PlatformShell>
  );
}
