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
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      return;
    }
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
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore quota / private mode
    }
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
    <div className="pwa-install-hint fixed inset-x-0 bottom-0 z-[60] md:hidden">
      <div className="border-t border-white/15 bg-[#0a0a0f]/96 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="mx-auto h-1 w-10 rounded-full bg-white/25" aria-hidden />
        <div className="mt-3 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-96x96.png" alt="" className="h-12 w-12 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-white">Instalar Qlyk</p>
            <p className="mt-1 text-sm leading-6 text-white/80">
              {iosHint
                ? "Toca Compartir y luego «Añadir a pantalla de inicio». Puedes cerrar este aviso y no volverá a salir."
                : "Acceso directo en tu pantalla. El feed y tus cursos se ven como una app. Puedes cerrarlo; no te lo volvemos a mostrar."}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl leading-none text-white/70"
            aria-label="Cerrar aviso de instalación"
          >
            ×
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 rounded-full border border-white/20 py-3 text-sm font-semibold text-white"
          >
            Ahora no
          </button>
          {iosHint ? (
            <button type="button" onClick={dismiss} className="btn-primary flex-1 rounded-full py-3 text-sm font-bold">
              Entendido
            </button>
          ) : (
            <button type="button" onClick={() => void install()} className="btn-primary flex-1 rounded-full py-3 text-sm font-bold">
              Instalar app
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
