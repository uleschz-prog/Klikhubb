"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/commerce/split";

const benefits = [
  "Entras a la academia en el mismo instante",
  "Te quedas en la comunidad del creador",
  "El creador cobra sin pedirte nada por fuera",
];

export function CheckoutForm({
  slug,
  title,
  price,
  currency,
  stripeEnabled,
}: {
  slug: string;
  title: string;
  price: number;
  currency: string;
  stripeEnabled: boolean;
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
      body: JSON.stringify({ slug }),
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
    router.push(`/checkout/success?order=${payload.orderId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-2xl border border-klik-line bg-klik-card p-5">
        <p className="text-[11px] uppercase tracking-wider text-white/40">Lo que te llevas</p>
        <ul className="mt-4 space-y-2 text-sm text-white/70">
          {benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="flex min-h-12 w-full items-center justify-between rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black disabled:opacity-60"
      >
        <span>{loading ? "Procesando…" : stripeEnabled ? `Pagar con Stripe · ${title}` : `Pagar ${title}`}</span>
        <span>{formatMoney(price, currency)}</span>
      </button>
      <p className="text-center text-[11px] text-white/35">
        {stripeEnabled
          ? "Stripe confirma el cargo. Entras a la academia cuando el pago queda listo."
          : "Un clic y ya estás dentro: academia, comunidad y el creador cobra."}
      </p>
    </form>
  );
}
