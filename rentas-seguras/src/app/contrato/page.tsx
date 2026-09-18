import { ContractForm } from "@/components/contract-form";
import { requireUser } from "@/lib/supabase/session";

export const metadata = { title: "Formulario del contrato" };

export default async function ContratoPage() {
  await requireUser("/contrato");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="stamp text-[10px] text-cedar-700">Expediente</p>
      <h1 className="mt-2 font-serif text-4xl">Datos del arrendamiento</h1>
      <p className="mt-3 max-w-2xl text-ink-700">
        Completa las cuatro secciones. La redacción se hace en servidor con
        OpenAI; el PDF se habilita al confirmar el pago de $499.00 MXN.
      </p>
      <div className="mt-8">
        <ContractForm />
      </div>
    </div>
  );
}
