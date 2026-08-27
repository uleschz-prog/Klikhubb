"use client";

import { useEffect, useRef, useState } from "react";

type HeroDemoVideoProps = {
  className?: string;
  /** Si true, el video llena el contenedor (hero full-bleed). */
  fill?: boolean;
};

export function HeroDemoVideo({ className = "", fill = true }: HeroDemoVideoProps) {
  const media = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const node = media.current;
    if (!node) return;
    node.muted = true;
    void node.play().catch(() => undefined);
  }, []);

  function toggleMute() {
    const node = media.current;
    if (!node) return;
    node.muted = !node.muted;
    setMuted(node.muted);
    void node.play().catch(() => undefined);
  }

  return (
    <div className={`relative overflow-hidden ${fill ? "absolute inset-0" : "h-full w-full"} ${className}`}>
      <video
        ref={media}
        className="h-full w-full object-cover"
        src="/videos/qlyk-hero-demo.mp4"
        poster="/videos/qlyk-hero-demo.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label="Demo de Qlyk: del video al pago en el feed"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-klik-black via-klik-black/75 to-klik-black/25" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-klik-black via-transparent to-klik-black/40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(0,240,255,0.12),transparent_45%),radial-gradient(circle_at_20%_80%,rgba(0,255,65,0.1),transparent_40%)]" />
      <button
        type="button"
        onClick={toggleMute}
        className="absolute bottom-6 right-6 z-10 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur transition hover:text-white"
      >
        {muted ? "Audio" : "Silencio"}
      </button>
    </div>
  );
}
