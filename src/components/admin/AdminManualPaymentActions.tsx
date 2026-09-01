"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminManualPaymentActions({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | "revoke" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "approve" | "reject" | "revoke") {
    const note =
      action === "approve"
        ? window.prompt("Nota interna (opcional). Ej: SPEI recibido 01/09.")
        : window.prompt(
            action === "reject"
              ? "Motivo del rechazo (obligatorio)."
              : "Motivo de revocar acceso (obligatorio).",
          );

    if (action !== "approve" && !note?.trim()) return;

    setBusy(action);
    setError(null);

    try {
      const response = await fetch("/api/admin/manual-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, note: note ?? undefined }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "No se pudo actualizar el pago.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => act("approve")}
          className="inline-flex min-h-10 items-center rounded-full bg-klik-green px-4 text-sm font-bold text-klik-black disabled:opacity-50"
        >
          {busy === "approve" ? "Confirmando…" : status === "PENDING" ? "Aprobar sin comprobante" : "Aprobar pago"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => act("reject")}
          className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy === "reject" ? "Rechazando…" : "Rechazar"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => act("revoke")}
          className="inline-flex min-h-10 items-center rounded-full border border-red-400/30 px-4 text-sm font-bold text-red-300 disabled:opacity-50"
        >
          {busy === "revoke" ? "Revocando…" : "Revocar acceso"}
        </button>
      </div>
      {error ? <p className="max-w-xs text-right text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
