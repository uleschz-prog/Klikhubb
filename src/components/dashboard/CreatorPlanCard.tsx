"use client";

import { useEffect, useState } from "react";
import type { CreatorPlanSnapshot } from "@/lib/commerce/creator-plan-billing";

function formatUntil(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export function CreatorPlanCard({ initial }: { initial?: CreatorPlanSnapshot | null }) {
  const [snapshot, setSnapshot] = useState<CreatorPlanSnapshot | null>(initial ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  useEffect(() => {
    if (initial) return;
    void (async () => {
      const response = await fetch("/api/creator/plan");
      if (!response.ok) return;
      setSnapshot((await response.json()) as CreatorPlanSnapshot);
    })();
  }, [initial]);

  async function switchPlan(plan: "payg" | "flat") {
    setBusy(plan);
    setError("");
    try {
      const response = await fetch("/api/creator/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch", plan }),
      });
      const payload = (await response.json()) as CreatorPlanSnapshot & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "No se pudo cambiar el plan.");
        return;
      }
      setSnapshot(payload);
    } finally {
      setBusy(null);
    }
  }

  async function submitProof() {
    if (!snapshot?.pendingInvoice) return;
    setBusy("proof");
    setError("");
    try {
      const response = await fetch("/api/creator/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "proof",
          invoiceId: snapshot.pendingInvoice.id,
          proofNote,
          proofUrl: proofUrl || undefined,
        }),
      });
      const payload = (await response.json()) as CreatorPlanSnapshot & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "No se pudo enviar el comprobante.");
        return;
      }
      setSnapshot(payload);
      setProofNote("");
      setProofUrl("");
    } finally {
      setBusy(null);
    }
  }

  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-klik-line bg-klik-card p-5">
        <p className="text-sm text-white/45">Cargando tu plan…</p>
      </div>
    );
  }

  const untilLabel = formatUntil(snapshot.planUntil);
  const paygActive = snapshot.effectivePlan === "payg";
  const flatActive = snapshot.effectivePlan === "flat";

  return (
    <div className="rounded-2xl border border-klik-line bg-klik-card p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">
        Tu modalidad
      </p>
      <h3 className="mt-1 font-display text-xl font-bold text-white">Cómo te cobra Qlyk</h3>
      <p className="mt-2 text-sm leading-6 text-white/55">
        Cambia cuando quieras. El fee de cada venta usa el plan activo en ese momento.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => switchPlan("payg")}
          className={`rounded-2xl border px-4 py-4 text-left transition ${
            paygActive && snapshot.preferredPlan === "payg"
              ? "border-klik-cyan bg-klik-cyan/10"
              : "border-white/10 hover:border-white/25"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {snapshot.payg.shortLabel}
          </p>
          <p className="mt-1 font-display text-lg font-bold text-white">{snapshot.payg.label}</p>
          <p className="mt-2 text-xs leading-5 text-white/55">{snapshot.payg.description}</p>
          {paygActive ? (
            <p className="mt-3 text-xs font-semibold text-klik-cyan">Activo ahora</p>
          ) : null}
        </button>

        <button
          type="button"
          disabled={busy !== null}
          onClick={() => switchPlan("flat")}
          className={`rounded-2xl border px-4 py-4 text-left transition ${
            flatActive || snapshot.preferredPlan === "flat"
              ? "border-klik-green bg-klik-green/10"
              : "border-white/10 hover:border-white/25"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {snapshot.flat.shortLabel}
          </p>
          <p className="mt-1 font-display text-lg font-bold text-white">{snapshot.flat.label}</p>
          <p className="mt-2 text-xs leading-5 text-white/55">{snapshot.flat.description}</p>
          {flatActive ? (
            <p className="mt-3 text-xs font-semibold text-klik-green">
              Activo{untilLabel ? ` hasta ${untilLabel}` : ""}
            </p>
          ) : snapshot.preferredPlan === "flat" ? (
            <p className="mt-3 text-xs font-semibold text-klik-green">Elegido · pendiente de pago</p>
          ) : null}
        </button>
      </div>

      {snapshot.preferredPlan === "flat" && !flatActive && snapshot.pendingInvoice ? (
        <div className="mt-5 rounded-2xl border border-klik-green/30 bg-black/30 p-4">
          <p className="text-sm font-semibold text-white">Activa el plan con SPEI</p>
          <p className="mt-1 text-sm text-white/55">
            Transfiere{" "}
            <span className="font-semibold text-klik-green">
              ${snapshot.pendingInvoice.amount} {snapshot.pendingInvoice.currency}
            </span>{" "}
            con referencia{" "}
            <span className="font-mono text-white">{snapshot.pendingInvoice.reference}</span> y sube
            el comprobante. Un admin lo confirma y tu periodo de 30 días empieza.
          </p>
          {snapshot.instructions ? (
            <p className="mt-2 text-xs text-white/40">
              {snapshot.instructions.bankName} · {snapshot.instructions.clabe} ·{" "}
              {snapshot.instructions.beneficiary}
            </p>
          ) : (
            <p className="mt-2 text-xs text-amber-300/80">
              Aún no hay datos SPEI públicos. Contacta a soporte para pagar el plan.
            </p>
          )}
          {snapshot.pendingInvoice.status !== "PROOF_SUBMITTED" ? (
            <div className="mt-4 space-y-2">
              <input
                type="url"
                value={proofUrl}
                onChange={(event) => setProofUrl(event.target.value)}
                placeholder="URL del comprobante (opcional)"
                className="min-h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30"
              />
              <textarea
                value={proofNote}
                onChange={(event) => setProofNote(event.target.value)}
                placeholder="Nota o folio de la transferencia"
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
              />
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => submitProof()}
                className="min-h-11 rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black disabled:opacity-60"
              >
                {busy === "proof" ? "Enviando…" : "Enviar comprobante"}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-klik-cyan">Comprobante enviado. Esperando confirmación.</p>
          )}
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
