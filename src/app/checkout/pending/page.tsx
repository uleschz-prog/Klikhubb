import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";

export const dynamic = "force-dynamic";

export default function CheckoutPendingPage({
  searchParams,
}: {
  searchParams: { slug?: string };
}) {
  const fichaHref = searchParams.slug ? `/c/${searchParams.slug}` : "/cursos";
  return (
    <PlatformShell title="Pago">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Pago en proceso</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Estamos confirmando el pago</h1>
      <p className="mt-3 max-w-xl text-sm text-white/60">
        Si elegiste OXXO o SPEI en Mercado Pago, el acceso se abre cuando el pago quede aprobado. Te avisamos
        aquí y en Mis cursos.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={fichaHref} className="rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black">
          Ver la ficha
        </Link>
        <Link href="/orders" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">
          Ver mis pedidos
        </Link>
      </div>
    </PlatformShell>
  );
}
