"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BUYER_REFUND_WINDOW_HOURS } from "@/config/refund-policy";

function formatUntil(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function BuyerRefundButton({
  orderId,
  refundUntil,
}: {
  orderId: string;
  refundUntil: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    const ok = window.confirm(
      `Tienes ${BUYER_REFUND_WINDOW_HOURS} horas desde la compra para pedir la devolución. Si continúas, pierdes el acceso al curso y Qlyk te reembolsa.`,
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/orders/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String(payload.error)
          : "No se pudo pedir la devolución.";
      if (!response.ok) {
        setError(message);
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo pedir la devolución.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 disabled:opacity-50"
      >
        {busy ? "Procesando…" : "Pedir devolución"}
      </button>
      <p className="text-[11px] text-white/35">Hasta {formatUntil(refundUntil)}</p>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
