"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { formatProductPrice } from "@/lib/commerce/billing";

type ManualInstructions = {
  bankName: string;
  beneficiary: string;
  clabe: string;
  accountNumber: string | null;
};

type ManualCheckout = {
  requestId: string;
  reference: string;
  amount: number;
  currency: string;
  instructions: ManualInstructions;
};

export function CheckoutForm({
  slug,
  title,
  price,
  currency,
  compact = false,
  cancelPath,
  onPaid,
  manualPaymentsEnabled,
}: {
  slug: string;
  title: string;
  price: number;
  currency: string;
  compact?: boolean;
  cancelPath?: string;
  onPaid?: (orderId: string) => void;
  manualPaymentsEnabled: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState<ManualCheckout | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function startCheckout(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, cancelPath }),
    });
    const payload = (await response.json()) as {
      error?: string;
      orderId?: string;
      mode?: string;
      requestId?: string;
      reference?: string;
      amount?: number;
      currency?: string;
      instructions?: ManualInstructions;
    };

    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? "No se pudo iniciar el pago.");
      return;
    }

    if (payload.mode === "manual" && payload.requestId && payload.reference && payload.instructions) {
      setManual({
        requestId: payload.requestId,
        reference: payload.reference,
        amount: payload.amount ?? price,
        currency: payload.currency ?? currency,
        instructions: payload.instructions,
      });
      setLoading(false);
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

  async function submitProof(event: React.FormEvent) {
    event.preventDefault();
    if (!manual) return;

    setLoading(true);
    setError("");

    try {
      let proofUrl: string | undefined;
      if (proofFile) {
        const blob = await upload(proofFile.name, proofFile, {
          access: "public",
          handleUploadUrl: "/api/checkout/proof/upload",
        });
        proofUrl = blob.url;
      }

      const response = await fetch("/api/checkout/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: manual.requestId,
          proofUrl,
          proofNote: proofNote.trim() || undefined,
        }),
      });
      const payload = (await response.json()) as { error?: string; orderId?: string | null };
      if (!response.ok) {
        setError(payload.error ?? "No se pudo enviar el comprobante.");
        return;
      }

      if (payload.orderId) {
        if (onPaid) {
          onPaid(payload.orderId);
          return;
        }
        router.push(`/checkout/success?order=${payload.orderId}`);
        router.refresh();
        return;
      }

      setSubmitted(true);
    } catch {
      setError("No se pudo enviar el comprobante.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className={compact ? "space-y-4" : "space-y-6"}>
        <div className="rounded-2xl border border-klik-green/30 bg-klik-green/5 p-5">
          <p className="font-display text-lg font-bold text-klik-green">Comprobante recibido</p>
          <p className="mt-2 text-sm text-white/65">
            Revisaremos tu transferencia pronto. Cuando la confirmemos, el acceso aparecerá en tu academy.
          </p>
        </div>
      </div>
    );
  }

  if (manual) {
    return (
      <form onSubmit={submitProof} className={compact ? "space-y-4" : "space-y-6"}>
        <div className="rounded-2xl border border-klik-line bg-klik-card p-5">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Transferencia SPEI</p>
          <p className="mt-3 font-display text-2xl font-extrabold text-klik-pastel">
            {formatProductPrice(manual.amount, manual.currency)}
          </p>
          <p className="mt-2 text-sm text-white/70">
            Referencia obligatoria: <span className="font-mono font-bold text-white">{manual.reference}</span>
          </p>
          <dl className="mt-4 space-y-2 text-sm text-white/70">
            <div className="flex justify-between gap-4">
              <dt>Banco</dt>
              <dd className="text-right text-white">{manual.instructions.bankName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Beneficiario</dt>
              <dd className="text-right text-white">{manual.instructions.beneficiary}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>CLABE</dt>
              <dd className="font-mono text-right text-white">{manual.instructions.clabe}</dd>
            </div>
            {manual.instructions.accountNumber ? (
              <div className="flex justify-between gap-4">
                <dt>Cuenta</dt>
                <dd className="font-mono text-right text-white">{manual.instructions.accountNumber}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-white/70">
            Comprobante (PDF o imagen)
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-sm text-white/60 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </label>
          <label className="block text-sm text-white/70">
            Nota (opcional)
            <textarea
              value={proofNote}
              onChange={(event) => setProofNote(event.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Ej: transferí hoy a las 14:30 desde BBVA"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-klik-green/40"
            />
          </label>
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading || (!proofFile && !proofNote.trim())}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Ya transferí — enviar comprobante"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={startCheckout} className={compact ? "space-y-4" : "space-y-6"}>
      {!compact ? (
        <div className="rounded-2xl border border-klik-line bg-klik-card p-5">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Lo que te llevas</p>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>Entras a la academia en cuanto confirmemos tu pago</li>
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
        <span>
          {loading
            ? "Procesando…"
            : manualPaymentsEnabled
              ? `Transferir por SPEI — ${title}`
              : `Pagar ${title}`}
        </span>
        <span>{formatProductPrice(price, currency)}</span>
      </button>
      <p className="text-center text-[11px] text-white/35">
        {manualPaymentsEnabled
          ? "Te damos los datos bancarios y confirmamos tu transferencia manualmente."
          : "Entorno local: el acceso se abre al instante, sin transferencia real."}
      </p>
    </form>
  );
}
