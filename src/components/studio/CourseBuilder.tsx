"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import type { StudioCourse, StudioLesson, StudioModule } from "@/lib/commerce/studio";

type Props = {
  initial: StudioCourse;
  blobEnabled: boolean;
};

export function CourseBuilder({ initial, blobEnabled }: Props) {
  const router = useRouter();
  const [course, setCourse] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [meta, setMeta] = useState({
    title: initial.title,
    description: initial.description,
    price: String(initial.price),
    level: initial.level ?? "",
    status: initial.status,
  });
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [openLessonForm, setOpenLessonForm] = useState<string | null>(
    initial.modules[0]?.id ?? null,
  );

  const lessonTotal = useMemo(
    () => course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0),
    [course.modules],
  );

  function flash(tone: "ok" | "error", text: string) {
    setMessage({ tone, text });
  }

  async function refresh() {
    const response = await fetch(`/api/studio/courses/${course.slug}`);
    const payload = (await response.json()) as { course?: StudioCourse; error?: string };
    if (response.ok && payload.course) {
      setCourse(payload.course);
      setMeta({
        title: payload.course.title,
        description: payload.course.description,
        price: String(payload.course.price),
        level: payload.course.level ?? "",
        status: payload.course.status,
      });
    }
    router.refresh();
  }

  async function saveMeta(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const price = Number(meta.price);
    if (!meta.title.trim() || !Number.isFinite(price) || price <= 0) {
      flash("error", "Revisa título y precio.");
      setBusy(false);
      return;
    }
    const response = await fetch(`/api/studio/courses/${course.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: meta.title.trim(),
        description: meta.description.trim(),
        price,
        level: meta.level.trim() || null,
        status: meta.status,
      }),
    });
    const payload = (await response.json()) as { error?: string; course?: StudioCourse };
    setBusy(false);
    if (!response.ok || !payload.course) {
      flash("error", payload.error ?? "No se pudo guardar.");
      return;
    }
    setCourse(payload.course);
    flash("ok", meta.status === "ACTIVE" ? "Curso publicado y a la venta." : "Cambios guardados.");
    router.refresh();
  }

  async function addModule(event: React.FormEvent) {
    event.preventDefault();
    if (!newModuleTitle.trim()) return;
    setBusy(true);
    const response = await fetch(`/api/studio/courses/${course.slug}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newModuleTitle.trim() }),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      flash("error", payload.error ?? "No se pudo crear el módulo.");
      return;
    }
    setNewModuleTitle("");
    await refresh();
    flash("ok", "Módulo agregado.");
  }

  async function renameModule(mod: StudioModule, title: string) {
    if (!title.trim() || title.trim() === mod.title) return;
    setBusy(true);
    const response = await fetch(`/api/studio/modules/${mod.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      flash("error", payload.error ?? "No se pudo renombrar.");
      return;
    }
    await refresh();
  }

  async function removeModule(mod: StudioModule) {
    if (!window.confirm(`¿Borrar el módulo “${mod.title}” y sus lecciones?`)) return;
    setBusy(true);
    const response = await fetch(`/api/studio/modules/${mod.id}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      flash("error", payload.error ?? "No se pudo borrar.");
      return;
    }
    await refresh();
    flash("ok", "Módulo eliminado.");
  }

  async function removeLesson(lesson: StudioLesson) {
    if (!window.confirm(`¿Borrar la lección “${lesson.title}”?`)) return;
    setBusy(true);
    const response = await fetch(`/api/studio/lessons/${lesson.id}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      flash("error", payload.error ?? "No se pudo borrar.");
      return;
    }
    await refresh();
  }

  async function moveLesson(lesson: StudioLesson, direction: "up" | "down") {
    setBusy(true);
    await fetch(`/api/studio/lessons/${lesson.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    setBusy(false);
    await refresh();
  }

  async function togglePreview(lesson: StudioLesson) {
    setBusy(true);
    await fetch(`/api/studio/lessons/${lesson.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFreePreview: !lesson.isFreePreview }),
    });
    setBusy(false);
    await refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-cyan">Constructor</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold">{course.title}</h1>
          <p className="mt-2 text-sm text-white/50">
            {lessonTotal} {lessonTotal === 1 ? "lección" : "lecciones"} · {course.modules.length}{" "}
            {course.modules.length === 1 ? "módulo" : "módulos"} ·{" "}
            <StatusPill status={course.status} />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/academy/${course.slug}`}
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
          >
            Ver como alumno
          </Link>
          <Link
            href="/studio"
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white/70"
          >
            Mis cursos
          </Link>
        </div>
      </div>

      <form onSubmit={saveMeta} className="rounded-2xl border border-klik-line bg-klik-card p-5 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Ficha del curso</p>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Título</span>
          <input
            value={meta.title}
            onChange={(event) => setMeta((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Descripción</span>
          <textarea
            value={meta.description}
            onChange={(event) => setMeta((prev) => ({ ...prev, description: event.target.value }))}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Precio USD</span>
            <input
              type="number"
              min={1}
              step="0.01"
              value={meta.price}
              onChange={(event) => setMeta((prev) => ({ ...prev, price: event.target.value }))}
              className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Nivel</span>
            <input
              value={meta.level}
              onChange={(event) => setMeta((prev) => ({ ...prev, level: event.target.value }))}
              placeholder="Intermedio"
              className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Estado</span>
            <select
              value={meta.status}
              onChange={(event) =>
                setMeta((prev) => ({ ...prev, status: event.target.value as StudioCourse["status"] }))
              }
              className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
            >
              <option value="DRAFT">Borrador</option>
              <option value="ACTIVE">A la venta</option>
              <option value="PAUSED">Pausado</option>
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-full bg-klik-cyan px-5 text-sm font-bold text-klik-black disabled:opacity-60"
        >
          Guardar ficha
        </button>
      </form>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Temario</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold">Módulos y lecciones</h2>
          </div>
          <form onSubmit={addModule} className="flex flex-wrap gap-2">
            <input
              value={newModuleTitle}
              onChange={(event) => setNewModuleTitle(event.target.value)}
              placeholder="Nuevo módulo"
              className="min-w-[180px] rounded-full border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
            />
            <button
              type="submit"
              disabled={busy || !newModuleTitle.trim()}
              className="min-h-11 rounded-full border border-klik-green/50 px-4 text-sm font-semibold text-klik-green disabled:opacity-50"
            >
              + Módulo
            </button>
          </form>
        </div>

        {course.modules.map((mod, moduleIndex) => (
          <article key={mod.id} className="rounded-2xl border border-klik-line bg-klik-card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-xs text-white/35">
                {String(moduleIndex + 1).padStart(2, "0")}
              </span>
              <input
                defaultValue={mod.title}
                onBlur={(event) => renameModule(mod, event.target.value)}
                className="min-w-0 flex-1 bg-transparent font-display text-lg font-bold text-white outline-none focus:text-klik-cyan"
              />
              <button
                type="button"
                onClick={() => removeModule(mod)}
                disabled={busy || course.modules.length <= 1}
                className="text-xs font-semibold uppercase tracking-wider text-white/35 hover:text-red-400 disabled:opacity-30"
              >
                Borrar
              </button>
            </div>

            <ul className="mt-4 space-y-2">
              {mod.lessons.map((lesson, lessonIndex) => (
                <li
                  key={lesson.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/5 bg-black/30 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">
                      <span className="mr-2 text-white/35">{lessonIndex + 1}.</span>
                      {lesson.title}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      {[
                        lesson.videoUrl ? "Video" : null,
                        lesson.content ? "Texto" : null,
                        lesson.resourceUrl ? `Archivo${lesson.resourceName ? `: ${lesson.resourceName}` : ""}` : null,
                        lesson.isFreePreview ? "Preview gratis" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Sin contenido"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moveLesson(lesson, "up")}
                      disabled={busy || lessonIndex === 0}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLesson(lesson, "down")}
                      disabled={busy || lessonIndex === mod.lessons.length - 1}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePreview(lesson)}
                      disabled={busy}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        lesson.isFreePreview
                          ? "border-klik-cyan/40 text-klik-cyan"
                          : "border-white/10 text-white/60"
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLesson(lesson)}
                      disabled={busy}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-red-300/80"
                    >
                      Borrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {openLessonForm === mod.id ? (
              <LessonCreateForm
                moduleId={mod.id}
                blobEnabled={blobEnabled}
                busy={busy}
                setBusy={setBusy}
                onCancel={() => setOpenLessonForm(null)}
                onDone={async () => {
                  setOpenLessonForm(null);
                  await refresh();
                  flash("ok", "Lección agregada.");
                }}
                onError={(text) => flash("error", text)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setOpenLessonForm(mod.id)}
                className="mt-4 min-h-11 rounded-full bg-klik-green/90 px-5 text-sm font-bold text-klik-black"
              >
                + Agregar lección
              </button>
            )}
          </article>
        ))}
      </section>

      {message ? (
        <p className={`text-sm ${message.tone === "error" ? "text-red-400" : "text-klik-green"}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

function LessonCreateForm({
  moduleId,
  blobEnabled,
  busy,
  setBusy,
  onCancel,
  onDone,
  onError,
}: {
  moduleId: string;
  blobEnabled: boolean;
  busy: boolean;
  setBusy: (value: boolean) => void;
  onCancel: () => void;
  onDone: () => Promise<void>;
  onError: (text: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [publishToFeed, setPublishToFeed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "uploading">("idle");

  async function uploadFile(file: File) {
    const blob = await upload(safeName(file), file, {
      access: "public",
      multipart: true,
      contentType: file.type || undefined,
      handleUploadUrl: "/api/studio/upload",
      onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
    });
    return blob.url;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      onError("Ponle título a la lección.");
      return;
    }

    try {
      setBusy(true);
      let finalVideoUrl = videoUrl.trim();
      let finalResourceUrl = resourceUrl.trim();
      let finalResourceName = resourceName.trim();

      if (videoFile) {
        if (!blobEnabled) {
          onError("Para subir un archivo activa Vercel Blob (BLOB_READ_WRITE_TOKEN).");
          setBusy(false);
          return;
        }
        setPhase("uploading");
        setProgress(0);
        finalVideoUrl = await uploadFile(videoFile);
      }

      if (resourceFile) {
        if (!blobEnabled) {
          onError("Para subir un archivo activa Vercel Blob (BLOB_READ_WRITE_TOKEN).");
          setBusy(false);
          return;
        }
        setPhase("uploading");
        setProgress(0);
        finalResourceUrl = await uploadFile(resourceFile);
        finalResourceName = finalResourceName || resourceFile.name;
      }

      if (!finalVideoUrl && !content.trim() && !finalResourceUrl) {
        onError("Agrega un video, texto o archivo.");
        setBusy(false);
        setPhase("idle");
        return;
      }

      const response = await fetch(`/api/studio/modules/${moduleId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim() || undefined,
          videoUrl: finalVideoUrl || undefined,
          resourceUrl: finalResourceUrl || undefined,
          resourceName: finalResourceName || undefined,
          isFreePreview,
          publishToFeed: Boolean(finalVideoUrl) && publishToFeed,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      setBusy(false);
      setPhase("idle");
      if (!response.ok) {
        onError(payload.error ?? "No se pudo crear la lección.");
        return;
      }
      await onDone();
    } catch {
      setBusy(false);
      setPhase("idle");
      onError("No se pudo subir. Revisa el archivo y tu conexión.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-xl border border-klik-cyan/25 bg-black/40 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-klik-cyan">Nueva lección</p>
      <input
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Título de la lección"
        className="w-full rounded-full border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
      />
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={3}
        placeholder="Texto / notas (opcional)"
        className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Video (archivo)</span>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/*"
            onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-xs text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-klik-cyan file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-klik-black"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">O URL YouTube / MP4</span>
          <input
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://youtu.be/… o https://…mp4"
            className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Archivo (PDF, ZIP…)</span>
          <input
            type="file"
            accept=".pdf,.zip,.doc,.docx,.ppt,.pptx,.mp3,.png,.jpg,.jpeg,.webp,application/pdf,application/zip"
            onChange={(event) => setResourceFile(event.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-xs text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/15 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">O URL del archivo</span>
          <input
            value={resourceUrl}
            onChange={(event) => setResourceUrl(event.target.value)}
            placeholder="https://…"
            className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
          />
        </label>
      </div>
      <input
        value={resourceName}
        onChange={(event) => setResourceName(event.target.value)}
        placeholder="Nombre del archivo (opcional)"
        className="w-full rounded-full border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-klik-cyan"
      />

      <div className="flex flex-wrap gap-4 text-sm text-white/70">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isFreePreview}
            onChange={(event) => setIsFreePreview(event.target.checked)}
            className="accent-klik-cyan"
          />
          Preview gratis
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={publishToFeed}
            onChange={(event) => setPublishToFeed(event.target.checked)}
            className="accent-klik-green"
          />
          También publicar el video en el feed
        </label>
      </div>

      {!blobEnabled ? (
        <p className="text-xs text-white/40">
          Subida de archivos requiere Vercel Blob. Mientras tanto usa YouTube o URLs https.
        </p>
      ) : null}

      {phase === "uploading" ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-klik-green transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black disabled:opacity-60"
        >
          {phase === "uploading" ? `Subiendo… ${progress}%` : "Guardar lección"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-full border border-white/15 px-5 text-sm text-white/60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function StatusPill({ status }: { status: StudioCourse["status"] }) {
  const label =
    status === "ACTIVE" ? "A la venta" : status === "PAUSED" ? "Pausado" : status === "DRAFT" ? "Borrador" : status;
  const tone =
    status === "ACTIVE"
      ? "text-klik-green"
      : status === "PAUSED"
        ? "text-amber-300"
        : "text-white/50";
  return <span className={tone}>{label}</span>;
}

function safeName(file: File) {
  const raw = file.name.trim() || "archivo";
  const safe = raw.replace(/[^\w.\-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return safe || "archivo";
}
