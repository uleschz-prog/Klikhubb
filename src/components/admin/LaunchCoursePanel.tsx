"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LaunchCourseStatus } from "@/lib/platform/launch-course";

export function LaunchCoursePanel({ initial }: { initial: LaunchCourseStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function publish() {
    if (
      !window.confirm(
        "¿Publicar Cierre Qlyk con lecciones, preview gratis y un clip en Tienda? Se puede repetir: no duplica lo que ya existe.",
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/bootstrap-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish-launch" }),
      });
      const data = (await response.json().catch(() => null)) as
        | {
            error?: string;
            launch?: LaunchCourseStatus & {
              created?: { course: boolean; lessons: number; shopClip: boolean };
            };
          }
        | null;

      if (!response.ok || !data?.launch) {
        setError(data?.error ?? "No se pudo publicar Cierre Qlyk.");
        return;
      }

      setStatus(data.launch);
      const created = data.launch.created;
      const parts: string[] = [];
      if (created?.lessons) parts.push(`${created.lessons} lección(es)`);
      if (created?.shopClip) parts.push("clip en Tienda");
      setMessage(parts.length ? `Listo: ${parts.join(", ")}.` : "Cierre Qlyk ya estaba publicado.");
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-klik-cyan/25 bg-klik-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold">Curso en venta</h2>
          <p className="mt-1 max-w-xl text-sm text-white/55">
            Cierre Qlyk es el curso activo. Esto sube lecciones, deja la primera en preview y publica un
            clip de Tienda con el video del hero (no es el bootstrap que se archiva al limpiar).
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void publish()}
          className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black disabled:opacity-50"
        >
          {busy ? "Publicando…" : "Publicar Cierre Qlyk"}
        </button>
      </div>

      <ul className="mt-5 space-y-2 text-sm">
        <li className={status.exists ? "text-white/70" : "text-white/40"}>
          {status.exists ? "✓" : "○"} Curso{" "}
          {status.slug ? (
            <Link href={status.links.studio} className="font-semibold text-klik-cyan hover:underline">
              {status.slug}
            </Link>
          ) : (
            "cierre-qlyk"
          )}{" "}
          · {status.status ?? "—"} · {status.lessonCount} lección(es)
          {status.previewCount ? ` · ${status.previewCount} preview` : ""}
        </li>
        <li className={status.shopClipId ? "text-klik-green" : "text-white/40"}>
          {status.shopClipId ? "✓" : "○"} Clip Shop{" "}
          {status.shopClipId ? (
            <Link href={status.links.feed} className="font-semibold text-klik-cyan hover:underline">
              ver en Tienda
            </Link>
          ) : (
            "(falta publicar)"
          )}
        </li>
        {status.exists ? (
          <li>
            <Link href={status.links.ficha} className="font-semibold text-klik-cyan hover:underline">
              Ficha pública
            </Link>
          </li>
        ) : null}
      </ul>

      {message ? <p className="mt-4 text-sm text-klik-green">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
    </section>
  );
}
