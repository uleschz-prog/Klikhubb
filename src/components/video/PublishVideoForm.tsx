"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

type ProductOption = { slug: string; title: string };

export function PublishVideoForm({
  blobEnabled,
  products,
}: {
  blobEnabled: boolean;
  products: ProductOption[];
}) {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [productSlug, setProductSlug] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "saving" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    let url = videoUrl.trim();

    try {
      if (file) {
        if (!blobEnabled) {
          setStatus("error");
          setMessage("Para subir un archivo hay que activar Vercel Blob (BLOB_READ_WRITE_TOKEN).");
          return;
        }
        setStatus("uploading");
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/video/upload",
        });
        url = blob.url;
      }

      if (!url) {
        setStatus("error");
        setMessage("Elige un archivo o pega la URL https de un MP4.");
        return;
      }

      setStatus("saving");
      const response = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          videoUrl: url,
          productSlug: productSlug || undefined,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error ?? "No se pudo publicar.");
        return;
      }
      setStatus("ok");
      setMessage("Ya está en el feed.");
      router.push("/feed");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("No se pudo subir. Revisa el archivo y tu conexión.");
    }
  }

  const busy = status === "uploading" || status === "saving";

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Qué estás diciendo</span>
        <textarea
          required
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Un video corto. Tu cara. Tu idea."
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none ring-klik-cyan placeholder:text-white/35 focus:ring-2"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Video</span>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-klik-cyan file:px-4 file:py-2 file:text-xs file:font-bold file:text-klik-black"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">O pega una URL .mp4</span>
        <input
          type="url"
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
          placeholder="https://…"
          className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none ring-klik-cyan placeholder:text-white/35 focus:ring-2"
        />
      </label>

      {products.length ? (
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Producto en el video</span>
          <select
            value={productSlug}
            onChange={(event) => setProductSlug(event.target.value)}
            className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none ring-klik-cyan focus:ring-2"
          >
            <option value="">Sin botón de compra</option>
            {products.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {!blobEnabled ? (
        <p className="text-xs text-white/40">
          La subida de archivo pide Vercel Blob. Mientras tanto puedes pegar una URL https de un MP4.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || status === "ok"}
        className="min-h-12 rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black disabled:opacity-60"
      >
        {status === "uploading" ? "Subiendo…" : status === "saving" ? "Publicando…" : status === "ok" ? "En el feed" : "Publicar"}
      </button>

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-400" : "text-klik-green"}`}>{message}</p>
      ) : null}
    </form>
  );
}
