"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CONTRACT_PRICE_MXN,
  FORM_STORAGE_KEY,
  MARKDOWN_STORAGE_KEY,
} from "@/lib/constants";
import {
  contractFormSchema,
  type ContractFormData,
} from "@/lib/contract-schema";

export function ContractResult() {
  const [form, setForm] = useState<ContractFormData | null>(null);
  const [paid, setPaid] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState<"pay" | "generate" | "pdf" | null>(
    null
  );

  useEffect(() => {
    const raw = sessionStorage.getItem(FORM_STORAGE_KEY);
    const storedMarkdown = sessionStorage.getItem(MARKDOWN_STORAGE_KEY);
    if (storedMarkdown) setMarkdown(storedMarkdown);
    if (raw) {
      const parsed = contractFormSchema.safeParse(JSON.parse(raw));
      if (parsed.success) setForm(parsed.data);
    }

    fetch("/api/mercadopago/status")
      .then(async (response) => {
        const body = (await response.json()) as { paid?: boolean };
        setPaid(Boolean(body.paid));
      })
      .catch(() => setPaid(false));
  }, []);

  async function startCheckout() {
    setPending("pay");
    setStatus(null);
    try {
      const response = await fetch("/api/mercadopago/checkout", {
        method: "POST",
      });
      const body = (await response.json()) as {
        initPoint?: string;
        sandboxInitPoint?: string | null;
        error?: string;
      };
      if (!response.ok || !body.initPoint) {
        throw new Error(body.error || "No se pudo abrir MercadoPago.");
      }
      window.location.href = body.sandboxInitPoint || body.initPoint;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error de pago.");
      setPending(null);
    }
  }

  async function generateContract() {
    if (!form) return;
    setPending("generate");
    setStatus(null);
    try {
      const response = await fetch("/api/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json()) as {
        markdown?: string;
        error?: string;
      };
      if (!response.ok || !body.markdown) {
        throw new Error(body.error || "No se pudo generar el contrato.");
      }
      setMarkdown(body.markdown);
      sessionStorage.setItem(MARKDOWN_STORAGE_KEY, body.markdown);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Error al generar el contrato."
      );
    } finally {
      setPending(null);
    }
  }

  async function downloadPdf() {
    if (!markdown) return;
    setPending("pdf");
    setStatus(null);
    try {
      const response = await fetch("/api/contract/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });
      if (response.status === 402) {
        throw new Error(
          `Paga $${CONTRACT_PRICE_MXN.toFixed(2)} MXN para desbloquear el PDF.`
        );
      }
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || "No se pudo descargar el PDF.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "contrato-arrendamiento-rentasseguras.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error de PDF.");
    } finally {
      setPending(null);
    }
  }

  if (!form) {
    return (
      <div className="paper-card rounded-2xl p-8">
        <h1 className="font-serif text-3xl">Aún no hay datos del contrato</h1>
        <p className="mt-2 text-ink-700">
          Completa el formulario de partes, inmueble y condiciones.
        </p>
        <Link
          href="/contrato"
          className="mt-6 inline-block rounded-full bg-cedar-600 px-5 py-2 text-paper-50"
        >
          Ir al formulario
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="paper-card rounded-2xl p-6">
        <p className="stamp text-[10px] text-cedar-700">Resumen</p>
        <h1 className="font-serif text-3xl">Contrato listo para elaborar</h1>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-700">Arrendador</dt>
            <dd className="font-medium">{form.arrendador.nombre}</dd>
          </div>
          <div>
            <dt className="text-ink-700">Arrendatario</dt>
            <dd className="font-medium">{form.arrendatario.nombre}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-ink-700">Inmueble</dt>
            <dd className="font-medium">{form.inmueble.direccion}</dd>
          </div>
          <div>
            <dt className="text-ink-700">Renta mensual</dt>
            <dd className="font-medium">
              ${form.condiciones.rentaMensualMxn.toLocaleString("es-MX")} MXN
            </dd>
          </div>
          <div>
            <dt className="text-ink-700">Pago de la plataforma</dt>
            <dd className="font-medium">
              {paid
                ? "Liquidado ($499.00 MXN)"
                : `Pendiente · $${CONTRACT_PRICE_MXN}.00 MXN`}
            </dd>
          </div>
        </dl>
      </section>

      <section className="paper-card flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-xl">Descarga en PDF</h2>
          <p className="text-sm text-ink-700">
            Cobro único de $499.00 MXN con MercadoPago. El Markdown se genera
            con OpenAI; el PDF solo se libera con el pago aprobado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!paid ? (
            <button
              type="button"
              onClick={startCheckout}
              disabled={pending !== null}
              className="rounded-full bg-cedar-600 px-5 py-2.5 text-sm font-medium text-paper-50 hover:bg-cedar-700 disabled:opacity-60"
            >
              {pending === "pay" ? "Abriendo Checkout…" : "Pagar $499 MXN"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={generateContract}
                disabled={pending !== null}
                className="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-paper-50 disabled:opacity-60"
              >
                {pending === "generate"
                  ? "Redactando…"
                  : markdown
                    ? "Volver a generar"
                    : "Generar contrato"}
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                disabled={pending !== null || !markdown}
                className="rounded-full bg-cedar-600 px-5 py-2.5 text-sm font-medium text-paper-50 disabled:opacity-60"
              >
                {pending === "pdf" ? "Preparando PDF…" : "Descargar PDF"}
              </button>
            </>
          )}
        </div>
      </section>

      {status ? (
        <p className="rounded-xl bg-cedar-600/10 px-4 py-3 text-sm text-cedar-700">
          {status}
        </p>
      ) : null}

      {markdown ? (
        <article className="paper-card rounded-2xl p-6">
          <h2 className="font-serif text-xl">Vista previa (Markdown)</h2>
          <pre className="mt-4 max-h-[32rem] overflow-auto whitespace-pre-wrap font-serif text-sm leading-relaxed text-ink-800">
            {markdown}
          </pre>
        </article>
      ) : null}

      <p className="text-sm">
        <Link href="/contrato" className="text-cedar-700 underline">
          Editar datos del formulario
        </Link>
      </p>
    </div>
  );
}
