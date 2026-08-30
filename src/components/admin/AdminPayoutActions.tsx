"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminPayoutActions({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"complete" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "complete" | "reject") {
    const note =
      action === "reject"
        ? window.prompt("Motivo del rechazo (opcional). El saldo vuelve al monedero del usuario.")
        : window.prompt("Nota interna (opcional). Ej: transferencia SPEI 30/08.");

    setBusy(action);
    setError(null);

    try {
      const response = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, action, note: note ?? undefined }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "No se pudo actualizar el retiro.");
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
          onClick={() => act("complete")}
          className="inline-flex min-h-10 items-center rounded-full bg-klik-green px-4 text-sm font-bold text-klik-black disabled:opacity-50"
        >
          {busy === "complete" ? "Marcando…" : "Marcar pagado"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => act("reject")}
          className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy === "reject" ? "Rechazando…" : "Rechazar y devolver"}
        </button>
      </div>
      {error ? <p className="max-w-xs text-right text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
