import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/session";

export default async function PagoPage() {
  await requireUser("/pago");
  redirect("/contrato/resultado");
}
