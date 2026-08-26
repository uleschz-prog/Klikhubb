"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/commerce/split";

export function CheckoutForm({
  slug,
  title,
  price,
  currency,
  stripeEnabled,
  compact = false,
  cancelPath,
  onPaid,
}: {
  slug: string;
  title: string;
  price: number;
  currency: string;
  stripeEnabled: boolean;
  compact?: boolean;
  cancelPath?: string;
  onPaid?: (orderId: string) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, cancelPath }),
    });
    const payload = (await response.json()) as { error?: string; orderId?: string; url?: string };
    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? "No se pudo completar el pago.");
      return;
    }
    if (payload.url) {
      window.location.href = payload.url;
      return;
    }
    if (!payload.orderId) {
      setLoading(false);
      setError("No se pudo completar el pago.");
      return;
    }
    setLoading(false);
    if (onPaid) {
      onPaid(payload.orderId);
      return;
    }
    router.push(`/checkout/success?order=${payload.orderId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-4" : "space-y-6"}>
      {!compact ? (
        <div className="rounded-2xl border border-klik-line bg-klik-card p-5">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Lo que te llevas</p>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>Entras a la academia en el mismo instante</li>
            <li>Te quedas en la comunidad del creador</li>
            <li>El creador cobra sin pedirte nada por fuera</li>
          </ul>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="flex min-h-12 w-full items-center justify-between rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black disabled:opacity-60"
      >
        <span>{loading ? "Procesando…" : stripeEnabled ? "Pagar con tarjeta" : `Pagar ${title}`}</span>
        <span>{formatMoney(price, currency)}</span>
      </button>
      <p className="text-center text-[11px] text-white/35">
        {stripeEnabled
          ? "Stripe cobra la tarjeta. El acceso llega cuando el pago queda listo."
          : "Este entorno aún no tiene Stripe. El acceso se abre sin tarjeta, solo para pruebas."}
      </p>
    </form>
  );
}
