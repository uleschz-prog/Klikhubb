import Link from "next/link";
import { requireUser } from "@/lib/supabase/session";

export const metadata = { title: "Pago pendiente" };

export default async function PagoPendientePage() {
  await requireUser("/pago/pendiente");

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="paper-card rounded-2xl p-8">
        <h1 className="font-serif text-3xl">Pago en proceso</h1>
        <p className="mt-3 text-ink-700">
          MercadoPago dejó el cobro de $499.00 MXN como pendiente. Cuando se
          apruebe podrás descargar el PDF.
        </p>
        <Link
          href="/contrato/resultado"
          className="mt-6 inline-block rounded-full bg-cedar-600 px-5 py-2.5 text-paper-50"
        >
          Volver al contrato
        </Link>
      </div>
    </div>
  );
}
