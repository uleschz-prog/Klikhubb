"use client";

import { useEffect } from "react";

/**
 * Sincroniza --app-vh con la altura visual real.
 * En Huawei Browser / HarmonyOS, 100dvh a veces mide mal (barra URL, gestos)
 * o no existe; visualViewport + innerHeight dan un alto usable estable.
 */
export function ViewportHeightSync() {
  useEffect(() => {
    const root = document.documentElement;

    function sync() {
      const viewport = window.visualViewport;
      const height = Math.round(viewport?.height ?? window.innerHeight);
      if (!height || height < 200) return;
      root.style.setProperty("--app-vh", `${height}px`);
    }

    sync();

    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
    };
  }, []);

  return null;
}
