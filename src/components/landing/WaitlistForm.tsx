"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const intents = [
  { value: "CREATOR", label: "Creador" },
  { value: "ENTREPRENEUR", label: "Miembro" },
  { value: "BOTH", label: "Los dos" },
] as const;

export function WaitlistForm({ variant = "hero" }: { variant?: "hero" | "giant" }) {
  const [email, setEmail] = useState("");
  const [intent, setIntent] = useState<(typeof intents)[number]["value"]>("BOTH");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intent }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error ?? "No pudimos guardar tu acceso. Intenta de nuevo.");
        return;
      }
      setStatus("ok");
      setMessage("Ya tienes lugar. Te escribimos cuando abran las primeras mil cuentas.");
    } catch {
      setStatus("error");
      setMessage("Red no disponible. Revisa tu conexión.");
    }
  }

  const giant = variant === "giant";

  return (
    <form onSubmit={onSubmit} className={giant ? "w-full" : "w-full max-w-xl"}>
      <div className={`flex flex-col gap-3 ${giant ? "sm:flex-row sm:items-stretch" : "sm:flex-row"}`}>
        <label className="sr-only" htmlFor={`waitlist-email-${variant}`}>
          Email
        </label>
        <input
          id={`waitlist-email-${variant}`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          className="min-h-12 flex-1 rounded-full border border-white/10 bg-black/60 px-5 text-sm text-white outline-none ring-klik-cyan placeholder:text-white/35 focus:ring-2"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "ok"}
          className="min-h-12 shrink-0 rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black shadow-[0_0_24px_rgba(0,255,65,0.28)] transition hover:brightness-110 disabled:opacity-60"
        >
          {status === "loading" ? "Enviando…" : status === "ok" ? "Tu lugar está" : "Quiero mi lugar"}
        </button>
      </div>

      <fieldset className="mt-4">
        <legend className="sr-only">Qué te describe</legend>
        <div className="flex flex-wrap gap-2">
          {intents.map((option) => {
            const active = intent === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setIntent(option.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${
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

      <AnimatePresence>
        {message ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-3 text-sm ${status === "ok" ? "text-klik-green" : "text-red-400"}`}
          >
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
