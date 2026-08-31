"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FirstContentStatus } from "@/lib/platform/first-content";

export function BootstrapContentPanel({ initial }: { initial: FirstContentStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function publish() {
    if (
      !window.confirm(
        "¿Publicar el curso «Empieza en Qlyk» y los clips iniciales en Shop y Play? Es seguro ejecutarlo más de una vez.",
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/bootstrap-content", { method: "POST" });
      const data = (await response.json().catch(() => null)) as
        | (FirstContentStatus & { error?: string; created?: { lessons: number } })
        | null;

      if (!response.ok || !data) {
        setError(data?.error ?? "No se pudo publicar el contenido.");
        return;
      }

      setStatus(data);
      const parts: string[] = [];
      if (data.created?.lessons) parts.push(`${data.created.lessons} lección(es)`);
      if (data.ready) parts.push("feeds listos");
      setMessage(parts.length ? `Listo: ${parts.join(", ")}.` : "Contenido verificado.");
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-klik-line bg-klik-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold">Primer contenido real</h2>
          <p className="mt-1 max-w-xl text-sm text-white/55">
            Curso oficial «Empieza en Qlyk», clip en Tienda (/feed) y clip en Play (/play). Usa el video hero
            alojado en la plataforma.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => publish()}
          className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black disabled:opacity-50"
        >
          {busy ? "Publicando…" : status.ready ? "Verificar contenido" : "Publicar contenido inicial"}
        </button>
      </div>

      <ul className="mt-5 space-y-2 text-sm">
        <li className={status.course.exists && status.course.status === "ACTIVE" ? "text-klik-green" : "text-white/70"}>
          {status.course.exists && status.course.status === "ACTIVE" ? "✓" : "○"} Curso{" "}
          <Link href={status.links.studio} className="font-semibold text-klik-cyan hover:underline">
            {status.course.slug}
          </Link>{" "}
          · {status.course.lessonCount} lección(es)
        </li>
        <li className={status.shopVideo.exists ? "text-klik-green" : "text-white/70"}>
          {status.shopVideo.exists ? "✓" : "○"} Clip Shop (Tienda){" "}
          <Link href={status.links.feed} className="font-semibold text-klik-cyan hover:underline">
            /feed
          </Link>
        </li>
        <li className={status.playVideo.exists ? "text-klik-green" : "text-white/70"}>
          {status.playVideo.exists ? "✓" : "○"} Clip Play{" "}
          <Link href={status.links.play} className="font-semibold text-klik-cyan hover:underline">
            /play
          </Link>
        </li>
        <li className="text-white/50">
          Marketplace:{" "}
          <Link href={status.links.marketplace} className="font-semibold text-klik-cyan hover:underline">
            /marketplace
          </Link>
        </li>
      </ul>

      {message ? <p className="mt-4 text-sm text-klik-green">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
