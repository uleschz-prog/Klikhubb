"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ConnectState = {
  enabled: boolean;
  connected: boolean;
  payoutsEnabled: boolean;
  dashboardUrl: string | null;
};

export function WalletConnectCard() {
  const router = useRouter();
  const [state, setState] = useState<ConnectState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/connect")
      .then((response) => response.json())
      .then((payload) => setState(payload as ConnectState))
      .catch(() => setState(null));
  }, []);

  if (!state?.enabled) {
    return (
      <div className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Depósito</p>
        <h2 className="mt-1 font-display text-xl font-bold">Retiros en revisión</h2>
        <p className="mt-3 text-sm leading-6 text-white/60">
          El comprador paga a Qlyk. Llevamos la cuenta 85/10/5 y, cuando pides retiro, el equipo te deposita
          a mano. Los depósitos automáticos a tu banco se activan cuando Stripe Connect esté operativo.
        </p>
      </div>
    );
  }

  async function connect() {
    setBusy(true);
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
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Cuenta bancaria</p>
      <h2 className="mt-1 font-display text-xl font-bold">Stripe Connect</h2>
      <p className="mt-3 text-sm leading-6 text-white/60">
        {state.payoutsEnabled
          ? "Tu cuenta está lista. Cuando retires, el dinero va a tu Stripe Express y de ahí a tu banco."
          : "Antes de retirar, conecta tu cuenta bancaria con Stripe. Solo lo haces una vez."}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {!state.payoutsEnabled ? (
          <button
            type="button"
            onClick={connect}
            disabled={busy}
            className="inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black disabled:opacity-60"
          >
            {busy ? "Abriendo Stripe…" : state.connected ? "Completar datos bancarios" : "Conectar cuenta bancaria"}
          </button>
        ) : null}
        {state.dashboardUrl ? (
          <a
            href={state.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white/80"
          >
            Ver panel Stripe
          </a>
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
