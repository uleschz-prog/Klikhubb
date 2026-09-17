"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QLYK_ACADEMY_SLUG } from "@/config/qlyk-academy";

export function AcademySubscribeButton({
  label = "Unirme por USD 50 / mes",
  className = "inline-flex min-h-12 items-center justify-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black",
}: {
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function subscribe() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: QLYK_ACADEMY_SLUG, cancelPath: "/academy" }),
    });
    const payload = (await response.json()) as { error?: string; code?: string; url?: string; mode?: string; orderId?: string };
    if (response.status === 401) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/academy")}`);
      return;
    }
    if (payload.code === "ALREADY_OWNED") {
      router.push("/academy/studio");
      router.refresh();
      return;
    }
    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? "No se pudo iniciar la suscripción.");
      return;
    }
    if (payload.mode === "stripe" && payload.url) {
      window.location.href = payload.url;
      return;
    }
    if (payload.mode === "manual") {
      router.push(`/checkout/${QLYK_ACADEMY_SLUG}`);
      return;
    }
    setLoading(false);
    router.push(payload.orderId ? `/checkout/success?order=${payload.orderId}&slug=${QLYK_ACADEMY_SLUG}` : "/academy/studio");
    router.refresh();
  }

  return (
    <div>
      <button type="button" disabled={loading} onClick={() => void subscribe()} className={className}>
        {loading ? "Abriendo pago…" : label}
      </button>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
