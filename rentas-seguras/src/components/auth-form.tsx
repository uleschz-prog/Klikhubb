"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const copy = useMemo(
    () =>
      mode === "login"
        ? {
            title: "Inicia sesión",
            submit: "Entrar",
            alt: "¿Aún no tienes cuenta?",
            altHref: "/registro",
            altCta: "Regístrate",
          }
        : {
            title: "Crea tu cuenta",
            submit: "Registrarme",
            alt: "¿Ya tienes cuenta?",
            altHref: "/iniciar-sesion",
            altCta: "Inicia sesión",
          },
    [mode]
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const supabase = createBrowserSupabaseClient();
      if (mode === "signup") {
        const origin = window.location.origin;
        const { data, error: signError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });
        if (signError) throw signError;
        if (data.session) {
          router.replace(nextPath);
          router.refresh();
          return;
        }
        setNotice(
          "Revisa tu correo para confirmar la cuenta. Después podrás iniciar sesión."
        );
        return;
      }

      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signError) throw signError;
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo completar la autenticación."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="paper-card mx-auto w-full max-w-md rounded-2xl p-8"
    >
      <p className="stamp text-[10px] text-cedar-700">Acceso seguro</p>
      <h1 className="mt-2 font-serif text-3xl text-ink-950">{copy.title}</h1>
      <p className="mt-2 text-sm text-ink-700">
        Correo y contraseña con Supabase Auth. Las rutas del contrato quedan
        protegidas.
      </p>

      <label className="mt-6 block text-sm font-medium">
        Correo
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-ink-700/20 bg-white px-3 py-2 outline-none ring-cedar-600/30 focus:ring"
        />
      </label>
      <label className="mt-4 block text-sm font-medium">
        Contraseña
        <input
          required
          minLength={8}
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-lg border border-ink-700/20 bg-white px-3 py-2 outline-none ring-cedar-600/30 focus:ring"
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-lg bg-cedar-600/10 px-3 py-2 text-sm text-cedar-700">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-4 rounded-lg bg-moss-800/10 px-3 py-2 text-sm text-moss-800">
          {notice}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-ink-950 py-2.5 font-medium text-paper-50 hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? "Un momento…" : copy.submit}
      </button>

      <p className="mt-4 text-center text-sm text-ink-700">
        {copy.alt}{" "}
        <Link className="text-cedar-700 underline" href={copy.altHref}>
          {copy.altCta}
        </Link>
      </p>
    </form>
  );
}
