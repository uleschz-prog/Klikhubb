import { ContractResult } from "@/components/contract-result";
import { requireUser } from "@/lib/supabase/session";

export const metadata = { title: "Contrato y descarga" };

export default async function ContratoResultadoPage() {
  await requireUser("/contrato/resultado");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ContractResult />
    </div>
  );
}
