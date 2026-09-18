import Link from "next/link";
import { requireUser } from "@/lib/supabase/session";

export const metadata = { title: "Pago no completado" };

export default async function PagoFalloPage() {
  await requireUser("/pago/fallo");

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="paper-card rounded-2xl p-8">
        <h1 className="font-serif text-3xl">El pago no se completó</h1>
        <p className="mt-3 text-ink-700">
          MercadoPago no aprobó el cargo de $499.00 MXN. Puedes intentarlo de
          nuevo; el PDF permanece bloqueado.
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
