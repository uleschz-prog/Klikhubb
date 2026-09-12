"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type LandingMode = "light" | "dark";

type LandingThemeContextValue = {
  mode: LandingMode;
  toggle: () => void;
  setMode: (mode: LandingMode) => void;
};

const LandingThemeContext = createContext<LandingThemeContextValue | null>(null);

const STORAGE_KEY = "qlyk-landing-theme";

function readInitialMode(): LandingMode {
  if (typeof window === "undefined") return "light";
  const fromQuery = new URLSearchParams(window.location.search).get("theme");
  if (fromQuery === "light" || fromQuery === "dark") return fromQuery;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function LandingThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<LandingMode>(() => readInitialMode());

  useEffect(() => {
    // Sync if URL/localStorage changed after mount (e.g. ?theme=)
    setModeState(readInitialMode());
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-landing-theme", mode);
  }, [mode]);

  const setMode = useCallback((next: LandingMode) => {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, toggle, setMode }), [mode, toggle, setMode]);

  return (
    <LandingThemeContext.Provider value={value}>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var q=new URLSearchParams(location.search).get('theme');var t=(q==='dark'||q==='light')?q:localStorage.getItem('${STORAGE_KEY}');if(t!=='dark'&&t!=='light'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-landing-theme',t);}catch(e){}})();`,
        }}
      />
      <div className="landing-root font-apple min-h-[100dvh] transition-colors duration-300" data-theme={mode}>
        {children}
      </div>
    </LandingThemeContext.Provider>
  );
}

export function useLandingTheme() {
  const ctx = useContext(LandingThemeContext);
  if (!ctx) throw new Error("useLandingTheme must be used within LandingThemeProvider");
  return ctx;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode, toggle } = useLandingTheme();
  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${className}`}
      style={{
        borderColor: "var(--l-border)",
        color: "var(--l-fg)",
        background: "var(--l-surface)",
      }}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
    </svg>
  );
}
