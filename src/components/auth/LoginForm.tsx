"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Credenciales inválidas o cuenta suspendida.");
      return;
    }
    window.location.href = callbackUrl;
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-klik-black px-4">
      <div className="w-full max-w-md rounded-3xl border border-klik-line bg-klik-card p-8">
        <Logo href="/" />
        <h1 className="mt-6 font-display text-3xl font-extrabold text-white">Entra a tu feed</h1>
        <p className="mt-2 text-sm text-white/50">La red social donde tu público te paga. Usa una cuenta demo o crea la tuya.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/45">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-full border border-white/10 bg-black px-4 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/45">
            Contraseña
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-full border border-white/10 bg-black px-4 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-full bg-klik-green text-sm font-bold text-klik-black disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Continuar"}
          </button>
        </form>

        {googleEnabled ? (
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="mt-3 min-h-12 w-full rounded-full border border-white/15 text-sm font-semibold text-white"
          >
            Continuar con Google
          </button>
        ) : null}

        <p className="mt-6 text-center text-sm text-white/45">
          ¿Sin cuenta?{" "}
          <a href="/register" className="text-klik-cyan">
            Crear cuenta
          </a>
        </p>
        <p className="mt-4 rounded-2xl border border-white/5 bg-black/40 p-3 text-[11px] leading-5 text-white/40">
          Demo comprador: rafa@klikhubb.dev · KlikHubb2026!
          <br />
          Creadora: maya@klikhubb.dev · mismo password. Código de amiga: MAYA
        </p>
      </div>
    </main>
  );
}
