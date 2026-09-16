"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ConnectStatus } from "@/lib/commerce/stripe-connect";

function requirementLabel(code: string) {
  if (code.includes("external_account")) return "cuenta bancaria";
  if (code.includes("verification.document")) return "identificación";
  if (code.includes("tos_acceptance")) return "aceptar términos de Stripe";
  if (code.includes("individual")) return "datos personales";
  if (code.includes("company")) return "datos de negocio";
  return code.replaceAll("_", " ");
}

export function WalletConnectCard({
  initial,
  connectNotice,
}: {
  initial: ConnectStatus | null;
  connectNotice?: "return" | "refresh" | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<ConnectStatus | null>(initial);
  const [busy, setBusy] = useState<"connect" | "dashboard" | "refresh" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connectNotice !== "return") return;
    void refreshStatus();
    // Solo al volver de Stripe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectNotice]);

  async function refreshStatus() {
    setBusy("refresh");
    setError(null);
    try {
      const response = await fetch("/api/connect");
      const payload = (await response.json()) as ConnectStatus & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "No pudimos leer el estado de Stripe.");
        return;
      }
      setState(payload);
      router.refresh();
    } catch {
      setError("No pudimos leer el estado de Stripe.");
    } finally {
      setBusy(null);
    }
  }

  if (state === null) {
    return (
      <div className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Depósito</p>
        <h2 className="mt-1 font-display text-xl font-bold">Retiros manuales</h2>
        <p className="mt-3 text-sm leading-6 text-white/60">
          El comprador paga a Qlyk. Cuando pides retiro, el equipo te deposita a mano. Cuando Stripe esté
          configurado, podrás vincular tu cuenta aquí para recibir el dinero en automático.
        </p>
      </div>
    );
  }

  if (!state.enabled) {
    return (
      <div className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Depósito</p>
        <h2 className="mt-1 font-display text-xl font-bold">Retiros manuales</h2>
        <p className="mt-3 text-sm leading-6 text-white/60">
          El comprador paga a Qlyk. Cuando pides retiro, el equipo te deposita a mano. Cuando Stripe esté
          configurado, podrás vincular tu cuenta aquí para recibir el dinero en automático.
        </p>
      </div>
    );
  }

  async function connect() {
    setBusy("connect");
    setError(null);
    try {
      const response = await fetch("/api/connect", { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string; detail?: string };
      if (!response.ok || !payload.url) {
        setError(
          payload.detail && payload.detail !== payload.error
            ? `${payload.error ?? "No pudimos abrir Stripe."} (${payload.detail})`
            : (payload.error ?? "No pudimos abrir Stripe."),
        );
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("No pudimos abrir Stripe.");
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
          Volviste de Stripe. Si ya completaste tus datos, pulsa «Actualizar estado».
        </p>
      ) : null}
      {connectNotice === "refresh" ? (
        <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          El enlace de Stripe expiró. Pulsa otra vez para continuar.
        </p>
      ) : null}

      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Tu banco</p>
      <h2 className="mt-1 font-display text-xl font-bold">Vincular Stripe</h2>
      <p className="mt-3 text-sm leading-6 text-white/60">
        {state.payoutsEnabled
          ? "Tu cuenta está lista. Cuando retires, transferimos el dinero a tu Stripe y de ahí a tu banco."
          : pendingRequirements
            ? "Stripe necesita un poco más de información antes de depositarte."
            : "Vincula tu cuenta de Stripe una vez. Así podemos transferirte lo que vendas."}
      </p>

      {pendingRequirements ? (
        <p className="mt-2 text-xs text-white/45">
          Pendiente: {state.requirementsDue.slice(0, 3).map(requirementLabel).join(", ")}
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
            onClick={() => void connect()}
            disabled={busy !== null}
            className="inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black disabled:opacity-60"
          >
            {busy === "connect"
              ? "Abriendo Stripe…"
              : state.connected
                ? "Completar datos"
                : "Vincular cuenta de Stripe"}
          </button>
        ) : null}
        {state.connected ? (
          <button
            type="button"
            onClick={() => void openDashboard()}
            disabled={busy !== null}
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white/80 disabled:opacity-60"
          >
            {busy === "dashboard" ? "Abriendo…" : "Ver panel Stripe"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void refreshStatus()}
          disabled={busy !== null}
          className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-5 text-sm font-semibold text-white/50 disabled:opacity-60"
        >
          {busy === "refresh" ? "Actualizando…" : "Actualizar estado"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
