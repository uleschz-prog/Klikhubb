"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/commerce/split";

export function WalletPayoutForm({
  available,
  minPayout,
  currency,
  amountMxn,
  fxRate,
  destination,
  mpPayoutsEnabled,
  usdtAddress,
  usdtPayoutsEnabled,
}: {
  available: number;
  minPayout: number;
  currency: string;
  amountMxn: number | null;
  fxRate: number | null;
  destination: string | null;
  mpPayoutsEnabled: boolean;
  usdtAddress: string | null;
  usdtPayoutsEnabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [method, setMethod] = useState<"mercadopago" | "usdt" | "manual">(
    mpPayoutsEnabled ? "mercadopago" : usdtPayoutsEnabled ? "usdt" : "manual",
  );
  const needsDestination =
    (method === "mercadopago" && mpPayoutsEnabled && !destination) ||
    (method === "usdt" && !usdtAddress);
  const canWithdraw = available >= minPayout && !needsDestination;

  async function submit() {
    if (busy || !canWithdraw) return;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const response = await fetch("/api/wallet/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
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
      const mxn =
        payload && typeof payload === "object" && "amountMxn" in payload && payload.amountMxn != null
          ? Number(payload.amountMxn)
          : amountMxn;
      const mode =
        payload && typeof payload === "object" && "mode" in payload ? String(payload.mode) : "manual";
      const mxnText = mxn ? ` (aprox. ${formatMoney(mxn, "MXN")})` : "";
      setDone(
        mode === "mercadopago"
          ? `Listo. Pedimos ${formatMoney(amount, currency)}${mxnText} a ${destination}. Te avisamos cuando se acredite.`
          : `Listo. Pedimos ${formatMoney(amount, currency)}${mxnText}. El equipo lo deposita a mano.`,
      );
      router.refresh();
    } catch {
      setError("No se pudo solicitar el retiro.");
    } finally {
      setBusy(false);
    }
  }

  const help = mpPayoutsEnabled
    ? destination
      ? `El mínimo es ${formatMoney(minPayout, currency)}. Lo enviaremos a tu cuenta Mercado Pago (${destination}).`
      : `El mínimo es ${formatMoney(minPayout, currency)}. Primero guarda el correo de tu cuenta Mercado Pago.`
    : `El mínimo es ${formatMoney(minPayout, currency)}. Por ahora el depósito lo hacemos a mano, usando el correo de Mercado Pago si lo guardaste.`;

  return (
    <div className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Retiro</p>
      <h2 className="mt-1 font-display text-xl font-bold">Saca lo disponible</h2>
      <p className="mt-3 text-sm leading-6 text-white/60">{help}</p>
      {mpPayoutsEnabled || usdtPayoutsEnabled || usdtAddress ? (
        <div className="mt-4 space-y-2 text-sm">
          {mpPayoutsEnabled ? (
            <label className="flex items-center gap-2 text-white/70">
              <input
                type="radio"
                name="payout-method"
                checked={method === "mercadopago"}
                onChange={() => setMethod("mercadopago")}
              />
              Mercado Pago {destination ? `(${destination})` : "(guarda tu correo)"}
            </label>
          ) : null}
          {usdtPayoutsEnabled || usdtAddress ? (
            <label className="flex items-center gap-2 text-white/70">
              <input
                type="radio"
                name="payout-method"
                checked={method === "usdt"}
                onChange={() => setMethod("usdt")}
              />
              USDT TRC20 {usdtAddress ? `(${usdtAddress.slice(0, 6)}…${usdtAddress.slice(-4)})` : "(guarda tu dirección)"}
            </label>
          ) : null}
        </div>
      ) : null}
      {amountMxn && fxRate ? (
        <p className="mt-2 text-xs text-white/40">
          Estimado al tipo de cambio actual: {formatMoney(amountMxn, "MXN")} (USD→MXN {fxRate.toFixed(2)}).
        </p>
      ) : null}
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
            : needsDestination && method === "usdt"
              ? "Guarda tu dirección USDT TRC20"
              : needsDestination
                ? "Guarda tu correo de Mercado Pago"
                : `Faltan ${formatMoney(Math.max(0, minPayout - available), currency)} para el mínimo`}
      </button>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {done ? <p className="mt-3 text-sm text-klik-green">{done}</p> : null}
    </div>
  );
}
