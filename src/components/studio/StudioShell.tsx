"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { PlatformHeader } from "@/components/layout/PlatformHeader";

type NavItem = {
  id: string;
  label: string;
  href?: string;
  soon?: boolean;
  hint?: string;
  children?: { label: string; href: string }[];
};

const NAV: NavItem[] = [
  { id: "inicio", label: "Inicio", href: "/studio" },
  {
    id: "productos",
    label: "Productos",
    children: [
      { label: "Cursos", href: "/studio#productos" },
      { label: "Videos", href: "/publish" },
      { label: "Crear curso", href: "/studio/new" },
    ],
  },
  { id: "ventas", label: "Ventas", href: "/studio#ventas" },
  { id: "monedero", label: "Monedero", href: "/wallet" },
  { id: "informes", label: "Informes", soon: true, hint: "Reportes detallados de tu negocio" },
  { id: "marketing", label: "Marketing", soon: true, hint: "Enlaces, cupones y campañas" },
  { id: "ajustes", label: "Ajustes", href: "/dashboard#perfil" },
];

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 11 12 4l8 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10.5V20h12v-9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 8 12 4l8 4-8 4-8-4Z" strokeLinejoin="round" />
      <path d="M4 8v8l8 4 8-4V8" strokeLinejoin="round" />
      <path d="M12 12v8" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 19V9M12 19V5M19 19v-7" strokeLinecap="round" />
    </svg>
  );
}
function IconWallet() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-9Z" />
      <path d="M16 14h.01" />
    </svg>
  );
}
function IconReport() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M7 4h8l5 5v11H7V4Z" strokeLinejoin="round" />
      <path d="M15 4v5h5M9 13h6M9 17h4" strokeLinecap="round" />
    </svg>
  );
}
function IconMegaphone() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 10v4l12 5V5L4 10Z" strokeLinejoin="round" />
      <path d="M16 10.5v3A3 3 0 0 1 13 16" strokeLinecap="round" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.5 6.5l1.5 1.5M16 16l1.5 1.5M17.5 6.5 16 8M8 16l-1.5 1.5" strokeLinecap="round" />
    </svg>
  );
}

const ICONS: Record<string, JSX.Element> = {
  inicio: <IconHome />,
  productos: <IconBox />,
  ventas: <IconChart />,
  monedero: <IconWallet />,
  informes: <IconReport />,
  marketing: <IconMegaphone />,
  ajustes: <IconSettings />,
};

function isActive(pathname: string, href?: string) {
  if (!href) return false;
  const [path, hash] = href.split("#");
  // The section anchors live on /studio; only "Inicio" should be current there.
  if (hash) return false;
  if (path === "/studio") return pathname === "/studio";
  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavList({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <nav className="space-y-1" aria-label="Área de creación">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href) || (item.id === "productos" && pathname.startsWith("/studio/") && pathname !== "/studio");
        if (item.soon) {
          return (
            <div
              key={item.id}
              title={item.hint ?? "Próximamente"}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-foreground/40 ${collapsed ? "justify-center" : ""}`}
            >
              <span className="shrink-0">{ICONS[item.id]}</span>
              {collapsed ? null : (
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate font-semibold">{item.label}</span>
                  <span className="rounded-full bg-foreground/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground/55">
                    Pronto
                  </span>
                </span>
              )}
            </div>
          );
        }

        if (item.children) {
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className={`flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green ${
                  active ? "bg-klik-green/10 text-foreground" : "text-foreground/70"
                } ${collapsed ? "justify-center" : ""}`}
                aria-expanded={open}
              >
                <span className="shrink-0">{ICONS[item.id]}</span>
                {collapsed ? <span className="sr-only">{item.label}</span> : <span className="flex-1 text-left">{item.label}</span>}
              </button>
              {open && !collapsed ? (
                <div className="mt-1 space-y-1 pl-10">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className="flex min-h-10 items-center rounded-xl px-2 text-sm text-foreground/65 transition hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.href ?? "/studio"}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green ${
              active ? "bg-klik-green/10 text-foreground" : "text-foreground/70"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <span className="shrink-0">{ICONS[item.id]}</span>
            {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StudioShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerId = useId();

  useEffect(() => {
    const saved = window.localStorage.getItem("qlyk-studio-nav");
    if (saved === "collapsed") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("qlyk-studio-nav", next ? "collapsed" : "open");
      return next;
    });
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <PlatformHeader title="Studio" />
      <div className="mx-auto flex max-w-[1400px]">
        <aside
          className={`sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 flex-col border-r border-klik-line bg-klik-card/40 p-3 md:flex ${
            collapsed ? "w-[4.5rem]" : "w-64"
          }`}
        >
          <div className={`mb-4 flex items-center ${collapsed ? "justify-center" : "justify-between px-2"}`}>
            {collapsed ? null : (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/45">Área de creación</p>
            )}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground/60 transition hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
              aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                {collapsed ? <path d="M9 6l6 6-6 6" strokeLinecap="round" /> : <path d="M15 6l-6 6 6 6" strokeLinecap="round" />}
              </svg>
            </button>
          </div>
          <NavList collapsed={collapsed} />
        </aside>

        <div className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-6 md:pb-10">{children}</div>
      </div>

      <button
        type="button"
        className="fixed bottom-[4.75rem] right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-klik-green px-4 text-sm font-bold text-klik-black shadow-lg md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
        aria-expanded={mobileOpen}
        aria-controls={drawerId}
        onClick={() => setMobileOpen(true)}
      >
        Menú Studio
      </button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
          <div
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Área de creación"
            className="studio-sheet absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-3xl border border-klik-line bg-background p-5 pb-8"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Logo className="text-foreground" />
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/45">Área de creación</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-klik-line text-sm font-semibold"
              >
                Cerrar
              </button>
            </div>
            <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <MobileTabBar />
    </div>
  );
}
