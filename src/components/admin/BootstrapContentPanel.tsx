"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FirstContentStatus } from "@/lib/platform/first-content";

export function BootstrapContentPanel({ initial }: { initial: FirstContentStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [busy, setBusy] = useState<"bootstrap" | "purge" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function bootstrap() {
    if (
      !window.confirm(
        "¿Crear el curso «Empieza en Qlyk» en borrador (sin publicar clips al feed)? Es seguro ejecutarlo más de una vez.",
      )
    ) {
      return;
    }

    setBusy("bootstrap");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/bootstrap-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json().catch(() => null)) as
        | (FirstContentStatus & { error?: string; created?: { lessons: number } })
        | null;

      if (!response.ok || !data) {
        setError(data?.error ?? "No se pudo crear el contenido.");
        return;
      }

      setStatus(data);
      const parts: string[] = [];
      if (data.created?.lessons) parts.push(`${data.created.lessons} lección(es)`);
      setMessage(parts.length ? `Listo: ${parts.join(", ")} en borrador.` : "Curso verificado (borrador).");
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  async function purge() {
    if (
      !window.confirm(
        "¿Eliminar del feed todos los videos placeholder (hero demo) y archivar el curso bootstrap? Esta acción limpia contenido no real.",
      )
    ) {
      return;
    }

    setBusy("purge");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/bootstrap-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purge" }),
      });
      const data = (await response.json().catch(() => null)) as
        | (FirstContentStatus & {
            error?: string;
            purge?: { deletedVideos: number; archivedProducts: number };
          })
        | null;

      if (!response.ok || !data) {
        setError(data?.error ?? "No se pudo limpiar el feed.");
        return;
      }

      setStatus(data);
      setMessage(
        `Feed limpio: ${data.purge?.deletedVideos ?? 0} video(s) eliminados, ${data.purge?.archivedProducts ?? 0} producto(s) archivados.`,
      );
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-klik-line bg-klik-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold">Contenido de plataforma</h2>
          <p className="mt-1 max-w-xl text-sm text-white/55">
            El feed solo debe mostrar videos reales de creadores. Usa «Limpiar placeholders» para quitar clips
            con el video demo y archivar el curso bootstrap.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => purge()}
            className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-red-400/40 px-5 text-sm font-bold text-red-300 disabled:opacity-50"
          >
            {busy === "purge" ? "Limpiando…" : "Limpiar placeholders"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => bootstrap()}
            className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black disabled:opacity-50"
          >
            {busy === "bootstrap" ? "Creando…" : "Curso borrador"}
          </button>
        </div>
      </div>

      <ul className="mt-5 space-y-2 text-sm">
        <li className={status.course.exists ? "text-white/70" : "text-white/40"}>
          {status.course.exists ? "✓" : "○"} Curso{" "}
          <Link href={status.links.studio} className="font-semibold text-klik-cyan hover:underline">
            {status.course.slug}
          </Link>{" "}
          · {status.course.status ?? "—"} · {status.course.lessonCount} lección(es)
        </li>
        <li className={status.shopVideo.exists ? "text-amber-300" : "text-klik-green"}>
          {status.shopVideo.exists ? "!" : "✓"} Clip Shop placeholder{" "}
          {status.shopVideo.exists ? "(aún en feed — limpia)" : "(ausente)"}
        </li>
        <li className={status.playVideo.exists ? "text-amber-300" : "text-klik-green"}>
          {status.playVideo.exists ? "!" : "✓"} Clip Play placeholder{" "}
          {status.playVideo.exists ? "(aún en feed — limpia)" : "(ausente)"}
        </li>
      </ul>

      {message ? <p className="mt-4 text-sm text-klik-green">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
    </section>
  );
}
