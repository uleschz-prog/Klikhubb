import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";

export const dynamic = "force-dynamic";

export default function CheckoutFailurePage() {
  return (
    <PlatformShell title="Pago">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-300">
        Pago no completado
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">No se pudo cobrar</h1>
      <p className="mt-3 max-w-xl text-sm text-white/60">
        El pago en Mercado Pago se canceló o falló. Puedes volver a intentar cuando quieras; no se te cobró
        acceso.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/marketplace"
          className="rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black"
        >
          Volver al marketplace
        </Link>
        <Link href="/feed" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">
          Ir al feed
        </Link>
      </div>
    </PlatformShell>
  );
}
