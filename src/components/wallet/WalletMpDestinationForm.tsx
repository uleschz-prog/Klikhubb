"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WalletMpDestinationForm({ email }: { email: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(email ?? "");
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
      const response = await fetch("/api/wallet/destination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String(payload.error)
          : "No se pudo guardar el correo.";
      if (!response.ok) {
        setError(message);
        return;
      }
      setDone("Listo. Usaremos este correo de Mercado Pago para tus retiros.");
      router.refresh();
    } catch {
      setError("No se pudo guardar el correo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-klik-line bg-klik-card p-4 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Cuenta de retiro</p>
      <h2 className="mt-1 font-display text-xl font-bold">Tu Mercado Pago</h2>
      <p className="mt-3 text-sm leading-6 text-white/60">
        Guarda el correo de la cuenta Mercado Pago donde quieres recibir tus retiros. Si el envío automático no está
        activo, el equipo lo usa como referencia para depositarte a mano.
      </p>
      <label className="mt-4 block text-xs uppercase tracking-wider text-white/40" htmlFor="mp-payout-email">
        Correo de Mercado Pago
      </label>
      <input
        id="mp-payout-email"
        type="email"
        required
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="tucorreo@email.com"
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-klik-cyan"
      />
      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-bold text-white disabled:opacity-40"
      >
        {busy ? "Guardando…" : email ? "Actualizar correo" : "Guardar correo"}
      </button>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {done ? <p className="mt-3 text-sm text-klik-green">{done}</p> : null}
    </form>
  );
}
