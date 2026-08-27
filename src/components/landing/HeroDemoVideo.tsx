"use client";

import { useEffect, useRef, useState } from "react";

type HeroDemoVideoProps = {
  className?: string;
  fill?: boolean;
};

export function HeroDemoVideo({ className = "", fill = true }: HeroDemoVideoProps) {
  const media = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = media.current;
    if (!node) return;

    const tryPlay = () => {
      node.muted = true;
      void node
        .play()
        .then(() => setReady(true))
        .catch(() => undefined);
    };

    tryPlay();
    node.addEventListener("loadeddata", tryPlay);
    node.addEventListener("canplay", tryPlay);
    return () => {
      node.removeEventListener("loadeddata", tryPlay);
      node.removeEventListener("canplay", tryPlay);
    };
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
      <img
        src="/videos/qlyk-hero-demo.jpg"
        alt=""
        className={`absolute inset-0 h-full w-full object-cover object-[68%_center] transition-opacity duration-700 md:object-[72%_center] ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      />
      <video
        ref={media}
        className={`absolute inset-0 h-full w-full object-cover object-[68%_center] transition-opacity duration-700 md:object-[72%_center] ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        src="/videos/qlyk-hero-demo.mp4"
        poster="/videos/qlyk-hero-demo.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label="Demo de Qlyk: del video al pago en el feed"
      />
      {/* Lectura a la izquierda, video visible a la derecha */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-klik-black via-klik-black/55 to-transparent md:via-klik-black/40" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-klik-black/90 via-transparent to-klik-black/30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(0,240,255,0.16),transparent_42%),radial-gradient(circle_at_20%_85%,rgba(0,255,65,0.1),transparent_38%)]" />
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
