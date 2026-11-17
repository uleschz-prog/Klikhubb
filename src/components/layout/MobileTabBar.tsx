"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navegación móvil estilo app: 5 destinos claros.
 * Ver = clips. Comprar = tienda. Cuenta = banca (saldo + ajustes).
 */
const tabs = [
  { href: "/play", label: "Ver", match: ["/play"] },
  { href: "/feed", label: "Comprar", match: ["/feed", "/marketplace"] },
  { href: "/search", label: "Buscar", match: ["/search"] },
  { href: "/orders", label: "Mis cosas", match: ["/orders", "/cursos", "/learn"] },
  { href: "/dashboard", label: "Yo", match: ["/dashboard", "/wallet", "/studio", "/notifications"] },
];

export function MobileTabBar({ variant = "page" }: { variant?: "page" | "media" }) {
  const pathname = usePathname();
  const media = variant === "media";

  return (
    <nav
      className={`pwa-native-bar fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl md:hidden ${
        media
          ? "media-tabbar border-white/10"
          : "border-klik-line bg-background/95 supports-[backdrop-filter]:bg-background/80"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid h-14 grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green ${
                  media
                    ? active
                      ? "text-klik-green"
                      : "text-white/55"
                    : active
                      ? "text-klik-green"
                      : "text-foreground/45"
                }`}
              >
                <span
                  className={`h-1 w-4 rounded-full ${active ? "bg-klik-green" : "bg-transparent"}`}
                  aria-hidden
                />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
