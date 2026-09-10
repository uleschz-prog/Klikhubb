"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Si Mercado Pago redirige con payment_id y el webhook aún no asentó,
 * confirma el pago desde el cliente (misma lógica idempotente).
 */
export function MercadoPagoReturnConfirm({
  paymentId,
}: {
  paymentId: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "working" | "done" | "pending" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!paymentId) return;
    let cancelled = false;

    async function run() {
      setStatus("working");
      try {
        const response = await fetch("/api/checkout/mercadopago/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        });
        const payload = (await response.json()) as {
          error?: string;
          settled?: boolean;
          orderId?: string;
          status?: string;
        };
        if (cancelled) return;
        if (!response.ok) {
          setStatus("error");
          setMessage(payload.error ?? "No se pudo confirmar el pago.");
          return;
        }
        if (payload.settled && payload.orderId) {
          setStatus("done");
          router.replace(`/checkout/success?order=${payload.orderId}`);
          router.refresh();
          return;
        }
        setStatus("pending");
        setMessage(
          payload.status
            ? `Estado Mercado Pago: ${payload.status}. El acceso se abrirá cuando el pago esté aprobado.`
            : "Pago en proceso. En cuanto Mercado Pago lo confirme, el acceso aparece en Academy.",
        );
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("No se pudo confirmar el pago.");
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [paymentId, router]);

  if (!paymentId || status === "idle" || status === "done") return null;

  return (
    <p className="mt-4 text-sm text-white/55">
      {status === "working" ? "Confirmando tu pago con Mercado Pago…" : null}
      {status === "pending" || status === "error" ? message : null}
    </p>
  );
}
