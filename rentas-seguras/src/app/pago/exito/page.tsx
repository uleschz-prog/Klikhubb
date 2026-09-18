import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/session";
import { getVerifiedPaymentForUser } from "@/lib/payments";

type Search = {
  payment_id?: string;
  collection_id?: string;
  confirmed?: string;
  reason?: string;
};

export const metadata = { title: "Pago aprobado" };

export default async function PagoExitoPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const user = await requireUser("/pago/exito");

  const paymentId = searchParams.payment_id || searchParams.collection_id;
  if (paymentId && searchParams.confirmed === undefined) {
    redirect(`/api/mercadopago/confirm?payment_id=${encodeURIComponent(paymentId)}`);
  }

  let approved = false;
  try {
    approved = Boolean(await getVerifiedPaymentForUser(user.id));
  } catch {
    approved = false;
  }

  const message = approved
    ? "Pago aprobado por $499.00 MXN. Ya puedes generar el contrato y descargar el PDF."
    : searchParams.reason === "config"
      ? "Falta MERCADOPAGO_ACCESS_TOKEN en el entorno."
      : "MercadoPago regresó, pero aún no confirmamos el cobro de $499.00 MXN.";

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="paper-card rounded-2xl p-8">
        <p className="stamp text-[10px] text-cedar-700">MercadoPago</p>
        <h1 className="mt-2 font-serif text-3xl">
          {approved ? "Pago recibido" : "Pago sin confirmar"}
        </h1>
        <p className="mt-3 text-ink-700">{message}</p>
        <Link
          href="/contrato/resultado"
          className="mt-6 inline-block rounded-full bg-cedar-600 px-5 py-2.5 text-paper-50"
        >
          Ir al contrato
        </Link>
      </div>
    </div>
  );
}
