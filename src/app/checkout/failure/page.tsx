import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";

export const dynamic = "force-dynamic";

export default function CheckoutFailurePage({
  searchParams,
}: {
  searchParams: { slug?: string };
}) {
  const retryHref = searchParams.slug ? `/checkout/${searchParams.slug}` : "/cursos";
  return (
    <PlatformShell title="Pago">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">Pago no completado</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">No se pudo completar el pago</h1>
      <p className="mt-3 max-w-xl text-sm text-white/60">
        Mercado Pago no confirmó el cargo. Puedes intentarlo de nuevo o elegir transferencia SPEI si está disponible.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={retryHref} className="rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black">
          Reintentar
        </Link>
        <Link href="/cursos" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">
          Ver cursos
        </Link>
      </div>
    </PlatformShell>
  );
}
