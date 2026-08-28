"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/profile/UserAvatar";

type ProfileAvatarUploadProps = {
  name: string;
  imageUrl?: string | null;
};

function avatarFileName(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `avatars/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

export function ProfileAvatarUpload({ name, imageUrl }: ProfileAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { update } = useSession();
  const [preview, setPreview] = useState<string | null>(imageUrl ?? null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveImageUrl(url: string | null) {
    const response = await fetch("/api/me/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });
    const payload = (await response.json()) as { error?: string; imageUrl?: string | null };
    if (!response.ok) {
      throw new Error(payload.error ?? "No pudimos guardar tu foto.");
    }
    setPreview(payload.imageUrl ?? null);
    await update({ image: payload.imageUrl ?? null });
  }

  async function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Elige una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Máximo 5 MB.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const blob = await upload(avatarFileName(file), file, {
        access: "public",
        handleUploadUrl: "/api/me/avatar/upload",
      });
      await saveImageUrl(blob.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos subir la foto.");
    } finally {
      setLoading(false);
    }
  }

  async function onRemove() {
    setLoading(true);
    setError("");
    try {
      await saveImageUrl(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos quitar la foto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <UserAvatar name={name} imageUrl={preview} size="xl" />

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Foto de perfil</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="min-h-10 rounded-full bg-klik-cyan px-4 text-sm font-bold text-klik-black disabled:opacity-60"
          >
            {loading ? "Subiendo…" : preview ? "Cambiar foto" : "Subir foto"}
          </button>
          {preview ? (
            <button
              type="button"
              disabled={loading}
              onClick={onRemove}
              className="min-h-10 rounded-full border border-white/15 px-4 text-sm font-semibold text-white/70 disabled:opacity-60"
            >
              Quitar
            </button>
          ) : null}
        </div>
        <p className="max-w-xs text-xs text-white/40">JPG, PNG o WebP · máx. 5 MB</p>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          className="hidden"
          onChange={onPickFile}
        />
      </div>
    </div>
  );
}
