import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string; pending?: string };
}) {
  const orderRef = searchParams.order ?? null;
  const pending = searchParams.pending === "1";

  const headline = pending ? "Comprobante recibido" : "Ya estás dentro";
  const body = pending
    ? "Revisaremos tu transferencia pronto. Cuando la confirmemos, el curso aparecerá en tu academy."
    : "Ya pagaste. El curso quedó en tu academy. El creador ve el dinero en el monedero, pendiente 14 días.";

  return (
    <PlatformShell title="Pago">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">
        {pending ? "Pago en revisión" : "Pago confirmado"}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{headline}</h1>
      <p className="mt-3 max-w-xl text-sm text-white/60">
        {body}
        {orderRef ? ` Ref ${orderRef}.` : ""}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-full bg-klik-green px-5 py-3 text-sm font-bold text-klik-black"
        >
          Ver mis ganancias
        </Link>
        <Link href="/academy" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">
          Ir a Academy
        </Link>
      </div>
    </PlatformShell>
  );
}
