"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const intents = [
  { value: "CREATOR", label: "Creador" },
  { value: "ENTREPRENEUR", label: "Miembro" },
  { value: "BOTH", label: "Los dos" },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [intent, setIntent] = useState<(typeof intents)[number]["value"]>("BOTH");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, email, password, intent, referralCode }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? "No pudimos crear la cuenta.");
      return;
    }
    const signed = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signed?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-klik-black px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-klik-line bg-klik-card p-8">
        <Logo href="/" />
        <h1 className="mt-6 font-display text-3xl font-extrabold text-white">Tu lugar en KlikHubb</h1>
        <p className="mt-2 text-sm text-white/50">Entra al feed. Publica. Vende. Quédate con tu gente.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="Nombre" value={displayName} onChange={setDisplayName} />
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Contraseña" type="password" value={password} onChange={setPassword} />
          <Field label="Código de un amigo (opcional)" value={referralCode} onChange={setReferralCode} required={false} placeholder="MAYA" />

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-white/45">Cómo entras</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {intents.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setIntent(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${
                    intent === option.value
                      ? "border-klik-cyan bg-klik-cyan/10 text-klik-cyan"
                      : "border-white/10 text-white/50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-full bg-klik-green text-sm font-bold text-klik-black disabled:opacity-60"
          >
            {loading ? "Creando…" : "Entrar a la red"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-white/45">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-klik-cyan">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-white/45">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-12 w-full rounded-full border border-white/10 bg-black px-4 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
      />
    </label>
  );
}
