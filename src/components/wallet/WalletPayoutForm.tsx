"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/commerce/split";

export function WalletPayoutForm({
  available,
  minPayout,
  currency,
}: {
  available: number;
  minPayout: number;
  currency: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const canWithdraw = available >= minPayout;

  async function submit() {
    if (busy || !canWithdraw) return;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const response = await fetch("/api/wallet/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload: unknown = await response.json().catch(() => null);
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String(payload.error)
          : "No se pudo solicitar el retiro.";
      if (!response.ok) {
        setError(message);
        return;
      }
      const amount =
        payload && typeof payload === "object" && "amount" in payload
          ? Number(payload.amount)
          : available;
      setDone(`Listo. Pedimos ${formatMoney(amount, currency)}. Te avisamos cuando salga.`);
      router.refresh();
    } catch {
      setError("No se pudo solicitar el retiro.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Retiro</p>
      <h2 className="mt-1 font-display text-xl font-bold">Saca lo disponible</h2>
      <p className="mt-3 text-sm leading-6 text-white/60">
        El mínimo es {formatMoney(minPayout, currency)}. El equipo deposita manualmente a tu cuenta bancaria.
      </p>
      <button
        type="button"
        onClick={submit}
        disabled={!canWithdraw || busy}
        className="mt-5 inline-flex min-h-12 items-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy
          ? "Solicitando…"
          : canWithdraw
            ? `Retirar ${formatMoney(available, currency)}`
            : `Faltan ${formatMoney(Math.max(0, minPayout - available), currency)} para el mínimo`}
      </button>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {done ? <p className="mt-3 text-sm text-klik-green">{done}</p> : null}
    </div>
  );
}
