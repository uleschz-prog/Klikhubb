"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Desktop: mismos 5 destinos que móvil, sin jerga. */
const links = [
  { href: "/play", label: "Ver", match: ["/play"] },
  { href: "/feed", label: "Comprar", match: ["/feed", "/marketplace"] },
  { href: "/search", label: "Buscar", match: ["/search"] },
  { href: "/studio", label: "Studio", match: ["/studio"] },
  { href: "/orders", label: "Mis cosas", match: ["/orders", "/cursos", "/learn"] },
  { href: "/dashboard", label: "Yo", match: ["/dashboard", "/wallet", "/notifications"] },
];

export function PlatformNav({ variant = "page" }: { variant?: "page" | "media" }) {
  const pathname = usePathname();
  const media = variant === "media";

  return (
    <nav className="hidden items-center gap-5 md:flex">
      {links.map((link) => {
        const active = link.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-2.5 py-1 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green ${
              media
                ? active
                  ? "bg-klik-green/20 text-klik-green"
                  : "text-white/80 hover:text-white"
                : active
                  ? "bg-klik-green/15 text-klik-green"
                  : "text-foreground/55 hover:text-foreground"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
