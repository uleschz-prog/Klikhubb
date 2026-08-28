"use client";

import { useEffect, useState } from "react";
import { isIosDevice, isMobileUserAgent, isStandaloneDisplayMode } from "@/lib/pwa/standalone";

const DISMISS_KEY = "qlyk-pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallHint() {
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandaloneDisplayMode()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    if (!isMobileUserAgent()) return;

    if (isIosDevice()) {
      const timer = window.setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 2400);
      return () => window.clearTimeout(timer);
    }

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="pwa-install-hint fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] md:hidden">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f]/95 shadow-[0_16px_48px_rgba(0,0,0,0.55)] ring-1 ring-klik-cyan/20 backdrop-blur-xl">
        <div className="flex items-start gap-3 p-4">
          <img src="/icons/icon-96x96.png" alt="" className="h-12 w-12 shrink-0 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.25)]" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-white">Instala Qlyk</p>
            <p className="mt-1 text-xs leading-5 text-white/60">
              {iosHint
                ? "Toca Compartir → «Añadir a inicio». Experiencia app premium, sin navegador."
                : "Acceso directo en tu pantalla. Feed, pagos y academia como app nativa."}
            </p>
          </div>
          <button type="button" onClick={dismiss} className="shrink-0 text-lg leading-none text-white/40" aria-label="Cerrar">
            ×
          </button>
        </div>
        {!iosHint ? (
          <div className="flex gap-2 border-t border-white/8 px-4 py-3">
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 rounded-full border border-white/15 py-2 text-xs font-semibold text-white/70"
            >
              Ahora no
            </button>
            <button
              type="button"
              onClick={() => void install()}
              className="flex-1 rounded-full bg-klik-green py-2 text-xs font-bold text-klik-black"
            >
              Instalar app
            </button>
          </div>
        ) : (
          <div className="border-t border-white/8 px-4 py-3">
            <button
              type="button"
              onClick={dismiss}
              className="w-full rounded-full bg-klik-cyan/15 py-2 text-xs font-semibold text-klik-cyan"
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
