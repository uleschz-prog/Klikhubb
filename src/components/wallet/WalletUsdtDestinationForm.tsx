"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WalletUsdtDestinationForm({ address }: { address: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(address ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const response = await fetch("/api/wallet/usdt-destination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: value }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String(payload.error)
          : "No se pudo guardar la dirección.";
      if (!response.ok) {
        setError(message);
        return;
      }
      setDone("Listo. Usaremos esta dirección TRC20 para tus retiros en USDT.");
      router.refresh();
    } catch {
      setError("No se pudo guardar la dirección.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">USDT (TRC20)</p>
      <h2 className="mt-1 font-display text-xl font-bold">Tu dirección de retiro</h2>
      <p className="mt-3 text-sm leading-6 text-white/60">
        Debe empezar con T y pertenecer a la red Tron. Si el envío automático no está activo, el equipo la usa como
        referencia para depositarte a mano.
      </p>
      <label className="mt-4 block text-xs uppercase tracking-wider text-white/40" htmlFor="usdt-address">
        Dirección USDT TRC20
      </label>
      <input
        id="usdt-address"
        type="text"
        required
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="T..."
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 font-mono text-sm text-white outline-none focus:border-klik-cyan"
      />
      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-bold text-white disabled:opacity-40"
      >
        {busy ? "Guardando…" : address ? "Actualizar dirección" : "Guardar dirección"}
      </button>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {done ? <p className="mt-3 text-sm text-klik-green">{done}</p> : null}
    </form>
  );
}
