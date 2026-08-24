import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/register-user";
import { demoRegister, isConnectionError } from "@/lib/demo/store";
import { registerSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa nombre, email y una contraseña de 8+ caracteres." },
      { status: 400 },
    );
  }

  const payload = {
    email: parsed.data.email,
    password: parsed.data.password,
    displayName: parsed.data.displayName,
    intent: parsed.data.intent,
    referralCode: parsed.data.referralCode?.trim() || undefined,
  };

  try {
    const user = await registerUser(payload);
    return NextResponse.json({ ok: true, referralCode: user.referralCode, mode: "postgres" });
  } catch (error) {
    const mapped = mapRegisterError(error);
    if (mapped) return mapped;
    if (!isConnectionError(error)) {
      console.error(error);
      return NextResponse.json({ error: "No pudimos crear la cuenta." }, { status: 500 });
    }
  }

  try {
    const user = await demoRegister(payload);
    return NextResponse.json({ ok: true, referralCode: user.referralCode, mode: "demo" });
  } catch (error) {
    return mapRegisterError(error) ?? NextResponse.json({ error: "No pudimos crear la cuenta." }, { status: 500 });
  }
}

function mapRegisterError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "EMAIL_TAKEN") {
    return NextResponse.json({ error: "Ese email ya está registrado." }, { status: 409 });
  }
  if (code === "INVALID_REFERRAL") {
    return NextResponse.json({ error: "Ese código de amigo no existe." }, { status: 400 });
  }
  return null;
}
