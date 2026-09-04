"use client";

import { useEffect, useRef, useState } from "react";

export function HeroDemoVideo() {
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
    <div className="pointer-events-none absolute inset-0 z-0 h-full min-h-[100svh] w-full overflow-hidden bg-klik-black">
      <video
        ref={media}
        className="absolute inset-0 h-full w-full object-cover object-[70%_center] [transform:translateZ(0)]"
        src="/videos/qlyk-hero-demo.mp4"
        poster="/videos/qlyk-hero-demo.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label="Demo de Qlyk: del video al pago en el feed"
      />
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-klik-black/92 via-klik-black/55 to-klik-black/35 md:via-klik-black/45 md:to-klik-black/25" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-klik-black/90 via-transparent to-klik-black/35" />
      <div className="absolute inset-0 z-[2] bg-[radial-gradient(circle_at_72%_42%,rgba(0,240,255,0.14),transparent_42%)]" />
      <button
        type="button"
        onClick={toggleMute}
        className="pointer-events-auto absolute bottom-6 left-6 z-[3] rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur transition hover:text-white md:left-auto md:right-6"
      >
        {muted ? "Audio" : "Silencio"}
      </button>
    </div>
  );
}
