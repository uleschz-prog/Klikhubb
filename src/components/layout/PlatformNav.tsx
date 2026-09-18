"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Desktop: mismos 5 destinos que móvil, sin jerga. */
const links = [
  { href: "/play", label: "Ver", match: ["/play"] },
  { href: "/feed", label: "Comprar", match: ["/feed", "/marketplace"] },
  { href: "/search", label: "Buscar", match: ["/search"] },
  { href: "/orders", label: "Mis cosas", match: ["/orders", "/cursos", "/learn"] },
  { href: "/dashboard", label: "Yo", match: ["/dashboard", "/wallet", "/studio", "/notifications"] },
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
            className={`text-sm font-semibold transition ${
              media
                ? active
                  ? "text-klik-cyan"
                  : "text-white/80 hover:text-white"
                : active
                  ? "text-klik-cyan"
                  : "text-foreground/55 hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
