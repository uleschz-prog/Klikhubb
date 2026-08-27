"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/Logo";

type Variant = "hero" | "section" | "page";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-white/10 bg-black/50 px-4 text-sm text-white outline-none backdrop-blur-sm transition placeholder:text-white/30 focus:border-klik-cyan/40 focus:ring-2 focus:ring-klik-cyan/30";

export function PremiumRegisterForm({ variant = "hero" }: { variant?: Variant }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const ref = params.get("ref") ?? params.get("code");
    if (ref) setReferralCode(ref.toUpperCase());
  }, [params]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        username: username.toLowerCase(),
        password,
        intent: "BOTH",
        referralCode: referralCode.trim() || undefined,
      }),
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
      setDone(true);
      router.push("/login");
      return;
    }
    setDone(true);
    router.push("/dashboard");
    router.refresh();
  }

  const isPage = variant === "page";
  const isSection = variant === "section";

  const form = (
    <form onSubmit={onSubmit} className={isPage ? "mt-8 space-y-3" : "space-y-3"}>
      <label className="block">
        <span className="sr-only">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="sr-only">Usuario</span>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-klik-cyan">
            @
          </span>
          <input
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
            placeholder="tuusuario"
            minLength={3}
            maxLength={20}
            pattern="[a-z0-9_]{3,20}"
            className={`${inputClass} pl-9`}
          />
        </div>
      </label>

      <label className="block">
        <span className="sr-only">Contraseña</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña · 8+ caracteres"
          className={inputClass}
        />
      </label>

      {referralCode ? (
        <p className="text-xs text-white/45">
          Invitación: <span className="font-semibold text-klik-cyan">{referralCode}</span>
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || done}
        className="min-h-12 w-full rounded-full bg-klik-green text-sm font-bold text-klik-black shadow-[0_0_28px_rgba(0,255,65,0.32)] transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Creando tu cuenta…" : done ? "Entrando…" : "Crear cuenta gratis"}
      </button>

      <AnimatePresence>
        {done ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm text-klik-green"
          >
            Listo. Te llevamos a tu feed.
          </motion.p>
        ) : null}
      </AnimatePresence>

      {!isPage ? (
        <p className="text-center text-xs text-white/45">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-klik-cyan hover:text-white">
            Entra
          </Link>
        </p>
      ) : null}
    </form>
  );

  if (isPage) {
    return (
      <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-klik-black px-4 py-10">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-klik-cyan/10 blur-[100px]" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-klik-green/10 blur-[110px]" />
        <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-klik-card/90 p-8 shadow-[0_0_80px_rgba(0,240,255,0.08)] backdrop-blur-xl">
          <Logo href="/" />
          <h1 className="mt-6 font-display text-3xl font-extrabold text-white">Cuenta gratis</h1>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Email, usuario y contraseña. Entras al feed en segundos.
          </p>
          {form}
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

  const shellClass = isSection
    ? "mx-auto w-full max-w-md rounded-[1.75rem] border border-white/10 bg-black/40 p-6 shadow-[0_0_60px_rgba(0,255,65,0.08)] backdrop-blur-xl"
    : "w-full max-w-md rounded-[1.75rem] border border-white/10 bg-black/45 p-5 shadow-[0_0_50px_rgba(0,240,255,0.1)] backdrop-blur-xl";

  return (
    <div className={shellClass}>
      {!isSection ? (
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">
          Registro gratis
        </p>
      ) : null}
      {form}
    </div>
  );
}
