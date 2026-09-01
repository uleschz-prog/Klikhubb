"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateCourseForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("49");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    const amount = Number(price);
    if (!title.trim() || !Number.isFinite(amount) || amount <= 0) {
      setStatus("error");
      setMessage("Ponle nombre y un precio válido.");
      return;
    }

    const response = await fetch("/api/studio/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        price: amount,
        level: level.trim() || undefined,
        billing: "ONE_TIME",
      }),
    });
    const payload = (await response.json()) as { error?: string; slug?: string };
    if (!response.ok || !payload.slug) {
      setStatus("error");
      setMessage(payload.error ?? "No se pudo crear el curso.");
      return;
    }
    router.push(`/studio/${payload.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Nombre del curso</span>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          placeholder="Academia de cierre"
          className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none ring-klik-cyan placeholder:text-white/35 focus:ring-2"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Qué se llevan</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={4000}
          rows={4}
          placeholder="Lo que tu alumno aprende y se lleva al terminar."
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none ring-klik-cyan placeholder:text-white/35 focus:ring-2"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Precio USD</span>
        <input
          required
          type="number"
          min={1}
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none ring-klik-cyan focus:ring-2"
        />
        <p className="mt-1 text-xs text-white/40">Pago único. El alumno transfiere y sube comprobante.</p>
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Nivel (opcional)</span>
        <input
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          maxLength={40}
          placeholder="Principiante"
          className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none ring-klik-cyan focus:ring-2"
        />
      </label>

      {message ? <p className="text-sm text-red-400">{message}</p> : null}

      <button
        type="submit"
        disabled={status === "saving"}
        className="inline-flex min-h-12 items-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black disabled:opacity-60"
      >
        {status === "saving" ? "Creando…" : "Crear curso"}
      </button>
    </form>
  );
}
