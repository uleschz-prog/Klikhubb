import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";

export const dynamic = "force-dynamic";

export default function CheckoutPendingPage() {
  return (
    <PlatformShell title="Pago">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
        Pago pendiente
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Estamos esperando la confirmación</h1>
      <p className="mt-3 max-w-xl text-sm text-white/60">
        Mercado Pago aún no marcó el pago como aprobado (por ejemplo transferencia o efectivo). Cuando se
        acredite, el acceso aparece solo en tu Academy.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/academy"
          className="rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black"
        >
          Ir a Academy
        </Link>
        <Link href="/orders" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">
          Ver mis pedidos
        </Link>
        <Link href="/feed" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">
          Volver al feed
        </Link>
      </div>
    </PlatformShell>
  );
}
