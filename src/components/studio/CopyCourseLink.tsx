"use client";

import { useState } from "react";

export function CopyCourseLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/c/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copia el enlace de tu ficha", url);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
    >
      {copied ? "Enlace copiado" : "Copiar enlace"}
    </button>
  );
}
