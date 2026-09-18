import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { contractFormSchema } from "@/lib/contract-schema";
import {
  generateLeaseContract,
  OpenAiNotConfiguredError,
} from "@/lib/generate-contract";
import { requireApiUser } from "@/lib/supabase/require-api-user";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la petición no es JSON válido." },
      { status: 400 }
    );
  }

  const parsed = contractFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Revisa los datos del formulario.",
        details: parsed.error.flatten(),
      },
      { status: 422 }
    );
  }

  try {
    const markdown = await generateLeaseContract(parsed.data);
    return NextResponse.json({
      markdown,
      generatedAt: new Date().toISOString(),
      userId: auth.user.id,
    });
  } catch (error) {
    if (error instanceof OpenAiNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const message =
      error instanceof Error ? error.message : "No se pudo generar el contrato.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
