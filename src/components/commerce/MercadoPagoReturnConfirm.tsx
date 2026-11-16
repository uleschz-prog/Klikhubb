"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function MercadoPagoReturnConfirm({
  paymentId,
  externalReference,
  slug,
}: {
  paymentId: string;
  externalReference?: string;
  slug?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("Confirmando tu pago con Mercado Pago…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void (async () => {
      try {
        const response = await fetch("/api/checkout/mercadopago/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, externalReference }),
        });
        const payload = (await response.json()) as {
          error?: string;
          settled?: boolean;
          status?: string;
          orderId?: string | null;
        };
        if (!response.ok) {
          setMessage(payload.error ?? "No se pudo confirmar el pago.");
          return;
        }
        if (payload.settled && payload.orderId) {
          const qs = new URLSearchParams({ order: payload.orderId });
          if (slug) qs.set("slug", slug);
          router.replace(`/checkout/success?${qs.toString()}`);
          router.refresh();
          return;
        }
        if (payload.status && payload.status !== "approved") {
          router.replace(`/checkout/pending?${slug ? `slug=${encodeURIComponent(slug)}` : ""}`);
          return;
        }
        setMessage("El pago está en proceso. En cuanto Mercado Pago lo confirme, el curso aparece en Mis cursos.");
        router.refresh();
      } catch {
        setMessage("No se pudo confirmar el pago. Si ya pagaste, espera un momento o escribe a soporte.");
      }
    })();
  }, [externalReference, paymentId, router, slug]);

  return <p className="mt-3 max-w-xl text-sm text-white/60">{message}</p>;
}
