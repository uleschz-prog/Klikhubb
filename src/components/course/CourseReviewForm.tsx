"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CourseReviewForm({
  slug,
  initialRating,
  initialComment,
}: {
  slug: string;
  initialRating: number;
  initialComment: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(initialRating || 0);
  const [comment, setComment] = useState(initialComment);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (rating < 1) {
      setError("Elige de 1 a 5.");
      return;
    }
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/courses/${encodeURIComponent(slug)}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setSaving(false);
    if (!response.ok) {
      setError(payload?.error ?? "No se pudo guardar la opinión.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-klik-line bg-klik-card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Tu opinión</p>
      <p className="mt-1 text-sm text-white/55">Solo quien ya compró el curso puede calificar. Sin estrellas de relleno.</p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className={`h-10 w-10 rounded-full text-lg ${
              value <= rating ? "bg-klik-cyan/20 text-klik-cyan" : "bg-white/5 text-white/35"
            }`}
            aria-label={`${value} de 5`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={400}
        rows={3}
        placeholder="¿Te sirvió el curso? (opcional)"
        className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-klik-cyan focus:ring-2"
      />
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black disabled:opacity-60"
      >
        {saving ? "Guardando…" : initialRating ? "Actualizar opinión" : "Publicar opinión"}
      </button>
    </form>
  );
}
