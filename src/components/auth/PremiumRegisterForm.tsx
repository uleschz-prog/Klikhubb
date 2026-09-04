"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { PasswordInput } from "@/components/auth/PasswordInput";

type Variant = "hero" | "section" | "page";

const intents = [
  { value: "CREATOR", label: "Creador" },
  { value: "ENTREPRENEUR", label: "Miembro" },
  { value: "BOTH", label: "Los dos" },
] as const;

const inputClass =
  "min-h-12 w-full rounded-2xl border border-white/10 bg-black/50 px-4 text-sm text-white outline-none backdrop-blur-sm transition placeholder:text-white/30 focus:border-klik-cyan/40 focus:ring-2 focus:ring-klik-cyan/30";

function detectLocale() {
  if (typeof navigator === "undefined") return "es";
  return navigator.language?.split("-")[0]?.toLowerCase() || "es";
}

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function PremiumRegisterForm({ variant = "hero" }: { variant?: Variant }) {
  const router = useRouter();
  const termsId = useId();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [intent, setIntent] = useState<(typeof intents)[number]["value"]>("BOTH");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [locale, setLocale] = useState("es");
  const [timezone, setTimezone] = useState("UTC");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setLocale(detectLocale());
    setTimezone(detectTimezone());
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!acceptTerms) {
      setError("Acepta los términos para continuar.");
      return;
    }

    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        email,
        username: username.toLowerCase(),
        password,
        intent,
        locale,
        timezone,
        acceptTerms: true,
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
  const compact = !isPage;

  const form = (
    <form onSubmit={onSubmit} className={isPage ? "mt-8 space-y-3" : "space-y-3"}>
      <label className="block">
        <span className={compact ? "sr-only" : "text-xs font-semibold uppercase tracking-wider text-white/45"}>
          Tu nombre
        </span>
        <input
          type="text"
          autoComplete="name"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Tu nombre"
          className={`${inputClass} ${compact ? "" : "mt-2"}`}
        />
      </label>

      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2"}>
        <label className="block">
          <span className={compact ? "sr-only" : "text-xs font-semibold uppercase tracking-wider text-white/45"}>
            Email
          </span>
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
          <span className={compact ? "sr-only" : "text-xs font-semibold uppercase tracking-wider text-white/45"}>
            Usuario
          </span>
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
      </div>

      <label className="block">
        <span className={compact ? "sr-only" : "text-xs font-semibold uppercase tracking-wider text-white/45"}>
          Contraseña
        </span>
        <PasswordInput
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña · 8+ caracteres"
          inputClassName={inputClass}
          wrapperClassName={compact ? "" : "mt-2"}
        />
      </label>

      <fieldset>
        <legend className="sr-only">Cómo entras a Qlyk</legend>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
          Vienes a Qlyk como
        </p>
        <div className="flex flex-wrap gap-2">
          {intents.map((option) => {
            const active = intent === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setIntent(option.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  active
                    ? "border-klik-cyan bg-klik-cyan/10 text-klik-cyan"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label htmlFor={termsId} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
        <input
          id={termsId}
          type="checkbox"
          checked={acceptTerms}
          onChange={(event) => setAcceptTerms(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black accent-klik-green"
        />
        <span className="text-xs leading-5 text-white/55">
          Acepto los{" "}
          <Link href="/legal/terms" className="text-klik-cyan hover:text-white">
            términos
          </Link>{" "}
          y la{" "}
          <Link href="/legal/privacy" className="text-klik-cyan hover:text-white">
            privacidad
          </Link>
          .
        </span>
      </label>

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
        <div className="relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-klik-card/90 p-8 shadow-[0_0_80px_rgba(0,240,255,0.08)] backdrop-blur-xl">
          <Logo href="/" />
          <h1 className="mt-6 font-display text-3xl font-extrabold text-white">Cuenta gratis</h1>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Tu perfil, tu feed y tu monedero. Registro directo, sin lista de espera.
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
    ? "mx-auto w-full max-w-lg rounded-[1.75rem] border border-white/10 bg-black/40 p-6 shadow-[0_0_60px_rgba(0,255,65,0.08)] backdrop-blur-xl"
    : "w-full max-w-md rounded-[1.75rem] border border-white/10 bg-black/55 p-5 shadow-[0_0_50px_rgba(0,240,255,0.12)] backdrop-blur-xl sm:p-6";

  return (
    <div className={shellClass}>
      {!isSection ? (
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">
            Crear cuenta
          </p>
          <p className="mt-1 text-sm text-white/55">Gratis · sin lista de espera</p>
        </div>
      ) : null}
      {form}
    </div>
  );
}
