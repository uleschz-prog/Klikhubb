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
import { LEGACY_THEME_STORAGE_KEY, THEME_STORAGE_KEY } from "@/components/theme/theme-boot";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const fromQuery = new URLSearchParams(window.location.search).get("theme");
  if (fromQuery === "light" || fromQuery === "dark") return fromQuery;
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return "light";
}

function writeMode(next: ThemeMode) {
  window.localStorage.setItem(THEME_STORAGE_KEY, next);
  window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
  document.documentElement.setAttribute("data-theme", next);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    setModeState(readStoredMode());
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    writeMode(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((current) => {
      const next = current === "light" ? "dark" : "light";
      writeMode(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, toggle, setMode }), [mode, toggle, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeToggle({
  className = "",
  tone = "page",
}: {
  className?: string;
  tone?: "page" | "media";
}) {
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark";
  const media = tone === "media";

  return (
    <button
      type="button"
      className={`relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-80 ${
        media
          ? "border border-white/25 bg-transparent text-white"
          : "border border-klik-line bg-klik-card text-foreground"
      } ${className}`}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }}
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
