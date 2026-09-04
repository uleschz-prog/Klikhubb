"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminCreatorPlanActions({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function run(action: "approve" | "reject") {
    setBusy(action);
    setError("");
    try {
      const response = await fetch("/api/admin/creator-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, invoiceId, note }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "No se pudo completar.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 md:w-56">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={status === "PROOF_SUBMITTED" ? "Nota (opcional al aprobar)" : "Motivo"}
        rows={2}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("approve")}
          className="min-h-10 flex-1 rounded-full bg-klik-green text-xs font-bold text-klik-black disabled:opacity-60"
        >
          {busy === "approve" ? "…" : "Aprobar"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("reject")}
          className="min-h-10 flex-1 rounded-full border border-white/15 text-xs font-bold text-white disabled:opacity-60"
        >
          {busy === "reject" ? "…" : "Rechazar"}
        </button>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
