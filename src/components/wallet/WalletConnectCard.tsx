"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ConnectState = {
  enabled: boolean;
  connected: boolean;
  payoutsEnabled: boolean;
  requirementsDue: string[];
  disabledReason: string | null;
};

export function WalletConnectCard({
  connectNotice,
}: {
  connectNotice?: "return" | "refresh" | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<ConnectState | null>(null);
  const [busy, setBusy] = useState<"connect" | "dashboard" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/connect")
      .then((response) => response.json())
      .then((payload) => setState(payload as ConnectState))
      .catch(() => setState(null));
  }, []);

  if (state === null) {
    return (
      <div className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
        <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-6 w-40 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-16 animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  if (!state.enabled) {
    return (
      <div className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Depósito</p>
        <h2 className="mt-1 font-display text-xl font-bold">Retiros manuales</h2>
        <p className="mt-3 text-sm leading-6 text-white/60">
          El comprador paga a Qlyk. Cuando pides retiro, el equipo te deposita a mano. Para retiros automáticos
          a tu banco, activa <span className="text-white/80">STRIPE_CONNECT_ENABLED=true</span> en Vercel y
          Connect en Stripe Dashboard.
        </p>
      </div>
    );
  }

  async function connect() {
    setBusy("connect");
    setError(null);
    try {
      const response = await fetch("/api/connect", { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "No pudimos abrir Stripe Connect.");
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("No pudimos abrir Stripe Connect.");
    } finally {
      setBusy(null);
    }
  }

  async function openDashboard() {
    setBusy("dashboard");
    setError(null);
    try {
      const response = await fetch("/api/connect/dashboard", { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "No pudimos abrir el panel Stripe.");
        return;
      }
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("No pudimos abrir el panel Stripe.");
    } finally {
      setBusy(null);
    }
  }

  const pendingRequirements = state.requirementsDue.length > 0 && !state.payoutsEnabled;

  return (
    <div className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
      {connectNotice === "return" ? (
        <p className="mb-4 rounded-xl border border-klik-green/30 bg-klik-green/10 px-4 py-3 text-sm text-klik-green">
          Volviste de Stripe. Si completaste tus datos, pulsa «Actualizar estado» o espera unos segundos.
        </p>
      ) : null}
      {connectNotice === "refresh" ? (
        <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          El enlace de Stripe expiró. Pulsa «Completar datos bancarios» para continuar.
        </p>
      ) : null}

      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Cuenta bancaria</p>
      <h2 className="mt-1 font-display text-xl font-bold">Stripe Connect</h2>
      <p className="mt-3 text-sm leading-6 text-white/60">
        {state.payoutsEnabled
          ? "Tu cuenta está lista. Cuando retires, el dinero va a tu Stripe Express y de ahí a tu banco."
          : pendingRequirements
            ? "Stripe necesita un poco más de información antes de habilitar depósitos a tu banco."
            : "Antes de retirar, conecta tu cuenta bancaria con Stripe. Solo lo haces una vez."}
      </p>

      {pendingRequirements ? (
        <p className="mt-2 text-xs text-white/45">
          Pendiente: {state.requirementsDue.slice(0, 3).join(", ")}
          {state.requirementsDue.length > 3 ? "…" : ""}
        </p>
      ) : null}
      {state.disabledReason ? (
        <p className="mt-2 text-xs text-amber-200/80">Estado Stripe: {state.disabledReason}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {!state.payoutsEnabled ? (
          <button
            type="button"
            onClick={connect}
            disabled={busy !== null}
            className="inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black disabled:opacity-60"
          >
            {busy === "connect" ? "Abriendo Stripe…" : state.connected ? "Completar datos bancarios" : "Conectar cuenta bancaria"}
          </button>
        ) : null}
        {state.connected ? (
          <button
            type="button"
            onClick={openDashboard}
            disabled={busy !== null}
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white/80 disabled:opacity-60"
          >
            {busy === "dashboard" ? "Abriendo…" : "Ver panel Stripe"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-5 text-sm font-semibold text-white/50"
        >
          Actualizar estado
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
