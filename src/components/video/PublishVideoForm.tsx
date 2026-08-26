"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

type ProductOption = { slug: string; title: string };
type OfferType = "COURSE" | "MEMBERSHIP" | "DIGITAL";

export function PublishVideoForm({
  blobEnabled,
  products,
}: {
  blobEnabled: boolean;
  products: ProductOption[];
}) {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [sell, setSell] = useState(true);
  const [productSlug, setProductSlug] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [offerPrice, setOfferPrice] = useState("49");
  const [offerType, setOfferType] = useState<OfferType>("COURSE");
  const [offerDescription, setOfferDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "saving" | "ok" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const usingExisting = Boolean(productSlug);

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
        if (file.size > 400 * 1024 * 1024) {
          setStatus("error");
          setMessage("El video puede pesar hasta 400 MB.");
          return;
        }
        setStatus("uploading");
        setProgress(0);
        const blob = await upload(clipFileName(file), file, {
          access: "public",
          multipart: true,
          contentType: file.type || undefined,
          handleUploadUrl: "/api/video/upload",
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        });
        url = blob.url;
      }

      if (!url) {
        setStatus("error");
        setMessage("Elige un archivo, pega un YouTube o la URL https de un MP4.");
        return;
      }

      setStatus("saving");
      const body: Record<string, unknown> = {
        caption,
        videoUrl: url,
      };
      if (sell && usingExisting) {
        body.productSlug = productSlug;
      } else if (sell) {
        const price = Number(offerPrice);
        if (!offerTitle.trim() || !Number.isFinite(price) || price <= 0) {
          setStatus("error");
          setMessage("Ponle nombre y precio al producto.");
          return;
        }
        body.offer = {
          title: offerTitle.trim(),
          price,
          type: offerType,
          description: offerDescription.trim() || undefined,
        };
      }

      const response = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string; id?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error ?? "No se pudo publicar.");
        return;
      }
      setStatus("ok");
      setMessage("Ya está en el feed.");
      router.push(payload.id ? `/feed?v=${payload.id}` : "/feed");
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
          placeholder="Un video corto. Tu cara. Tu idea. #qlyk"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none ring-klik-cyan placeholder:text-white/35 focus:ring-2"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Video</span>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-klik-cyan file:px-4 file:py-2 file:text-xs file:font-bold file:text-klik-black"
        />
        {file ? (
          <p className="mt-2 text-xs text-white/45">
            {file.name} · {formatBytes(file.size)}
          </p>
        ) : (
          <p className="mt-2 text-xs text-white/40">MP4, MOV o WebM. Hasta 400 MB. Desde el rollo o la cámara.</p>
        )}
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">O pega YouTube o un .mp4</span>
        <input
          type="text"
          inputMode="url"
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
          placeholder="https://youtu.be/… o https://…mp4"
          className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none ring-klik-cyan placeholder:text-white/35 focus:ring-2"
        />
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
        <input
          type="checkbox"
          checked={sell}
          onChange={(event) => setSell(event.target.checked)}
          className="h-4 w-4 accent-klik-green"
        />
        <span className="text-sm text-white/80">Vender en este video</span>
      </label>

      {sell ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          {products.length ? (
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Producto</span>
              <select
                value={productSlug}
                onChange={(event) => setProductSlug(event.target.value)}
                className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none ring-klik-cyan focus:ring-2"
              >
                <option value="">Crear uno nuevo</option>
                {products.map((product) => (
                  <option key={product.slug} value={product.slug}>
                    {product.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {!usingExisting ? (
            <>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Nombre del producto</span>
                <input
                  required={sell}
                  value={offerTitle}
                  onChange={(event) => setOfferTitle(event.target.value)}
                  maxLength={80}
                  placeholder="Academia de cierre"
                  className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none ring-klik-cyan placeholder:text-white/35 focus:ring-2"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Precio USD</span>
                  <input
                    required={sell}
                    type="number"
                    min={1}
                    step="0.01"
                    value={offerPrice}
                    onChange={(event) => setOfferPrice(event.target.value)}
                    className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none ring-klik-cyan focus:ring-2"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Tipo</span>
                  <select
                    value={offerType}
                    onChange={(event) => setOfferType(event.target.value as OfferType)}
                    className="mt-2 w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white outline-none ring-klik-cyan focus:ring-2"
                  >
                    <option value="COURSE">Academia</option>
                    <option value="MEMBERSHIP">Membresía</option>
                    <option value="DIGITAL">Digital</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Qué se llevan</span>
                <textarea
                  value={offerDescription}
                  onChange={(event) => setOfferDescription(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Lo que queda después del clic."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none ring-klik-cyan placeholder:text-white/35 focus:ring-2"
                />
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      {!blobEnabled ? (
        <p className="text-xs text-white/40">
          La subida de archivo pide Vercel Blob. Mientras tanto pega un YouTube o la URL https de un MP4.
        </p>
      ) : (
        <p className="text-xs text-white/40">También puedes pegar un YouTube si el clip ya está en la red.</p>
      )}

      {status === "uploading" ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-klik-green transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={busy || status === "ok"}
        className="min-h-12 rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black disabled:opacity-60"
      >
        {status === "uploading"
          ? `Subiendo… ${progress}%`
          : status === "saving"
            ? "Publicando…"
            : status === "ok"
              ? "En el feed"
              : "Publicar"}
      </button>

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-400" : "text-klik-green"}`}>{message}</p>
      ) : null}
    </form>
  );
}

function clipFileName(file: File) {
  const raw = file.name.trim() || "clip";
  const safe = raw.replace(/[^\w.\-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  if (/\.(mp4|webm|mov|m4v)$/i.test(safe)) return safe;
  const ext = file.type.includes("webm") ? "webm" : file.type.includes("quicktime") || file.type.includes("m4v") ? "mov" : "mp4";
  return `${safe || "clip"}.${ext}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
