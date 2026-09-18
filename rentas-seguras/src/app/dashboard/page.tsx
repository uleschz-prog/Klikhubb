import Link from "next/link";
import { requireUser } from "@/lib/supabase/session";
import { getVerifiedPaymentForUser } from "@/lib/payments";
import { CONTRACT_PRICE_MXN } from "@/lib/constants";
import { IntegrationStatus } from "@/components/integration-status";

export const metadata = { title: "Panel" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  let paid = false;
  try {
    paid = Boolean(await getVerifiedPaymentForUser(user.id));
  } catch {
    paid = false;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="stamp text-[10px] text-cedar-700">Tu espacio</p>
      <h1 className="mt-2 font-serif text-4xl">Panel</h1>
      <p className="mt-3 text-ink-700">
        Sesión activa: <strong>{user.email}</strong>
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="paper-card rounded-2xl p-6">
          <h2 className="font-serif text-2xl">Nuevo contrato</h2>
          <p className="mt-2 text-sm text-ink-700">
            Captura arrendador, arrendatario, inmueble y condiciones. Después se
            cobra el PDF.
          </p>
          <Link
            href="/contrato"
            className="mt-5 inline-block rounded-full bg-cedar-600 px-5 py-2 text-sm text-paper-50"
          >
            Llenar formulario
          </Link>
        </article>
        <article className="paper-card rounded-2xl p-6">
          <h2 className="font-serif text-2xl">Pago del PDF</h2>
          <p className="mt-2 text-sm text-ink-700">
            {paid
              ? "Ya hay un pago aprobado de $499.00 MXN. Puedes generar y descargar."
              : `Aún no se registra el cobro de $${CONTRACT_PRICE_MXN}.00 MXN.`}
          </p>
          <Link
            href="/contrato/resultado"
            className="mt-5 inline-block rounded-full border border-ink-700/20 px-5 py-2 text-sm"
          >
            Ver resultado
          </Link>
        </article>
      </div>
      <div className="mt-6">
        <IntegrationStatus />
      </div>
    </div>
  );
}
