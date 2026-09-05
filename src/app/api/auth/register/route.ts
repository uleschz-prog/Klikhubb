import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/register-user";
import { demoRegister, shouldUseDemoFallback } from "@/lib/demo/store";
import { registerSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    return NextResponse.json(
      { error: first ?? "Revisa los datos del registro." },
      { status: 400 },
    );
  }

  const payload = {
    email: parsed.data.email,
    username: parsed.data.username,
    password: parsed.data.password,
    displayName: parsed.data.displayName,
    locale: parsed.data.locale,
    timezone: parsed.data.timezone,
  };

  try {
    const user = await registerUser(payload);
    return NextResponse.json({ ok: true, id: user.id, mode: "postgres" });
  } catch (error) {
    const mapped = mapRegisterError(error);
    if (mapped) return mapped;
    if (!shouldUseDemoFallback(error)) {
      console.error(error);
      return NextResponse.json(
        { error: "El servicio no está disponible. Intenta de nuevo en unos minutos." },
        { status: 503 },
      );
    }
  }

  try {
    const user = await demoRegister(payload);
    return NextResponse.json({ ok: true, id: user.id, mode: "demo" });
  } catch (error) {
    return mapRegisterError(error) ?? NextResponse.json({ error: "No pudimos crear la cuenta." }, { status: 500 });
  }
}

function mapRegisterError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "EMAIL_TAKEN") {
    return NextResponse.json({ error: "Ese email ya está registrado." }, { status: 409 });
  }
  if (code === "USERNAME_TAKEN") {
    return NextResponse.json({ error: "Ese usuario ya existe. Prueba otro." }, { status: 409 });
  }
  return null;
}
