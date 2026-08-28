"use client";

import { useEffect } from "react";
import { isStandaloneDisplayMode } from "@/lib/pwa/standalone";

const PWA_CLASS = "pwa-standalone";

export function PwaRoot() {
  useEffect(() => {
    const root = document.documentElement;

    function applyStandaloneClass() {
      if (isStandaloneDisplayMode()) root.classList.add(PWA_CLASS);
      else root.classList.remove(PWA_CLASS);
    }

    applyStandaloneClass();

    const media = window.matchMedia("(display-mode: standalone)");
    media.addEventListener("change", applyStandaloneClass);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }

    return () => media.removeEventListener("change", applyStandaloneClass);
  }, []);

  return null;
}
