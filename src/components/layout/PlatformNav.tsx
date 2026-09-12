"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Desktop: mismos 5 destinos que móvil, sin jerga (Hub/Market/Academy). */
const links = [
  { href: "/play", label: "Ver", match: ["/play"] },
  { href: "/feed", label: "Comprar", match: ["/feed", "/marketplace"] },
  { href: "/search", label: "Buscar", match: ["/search"] },
  { href: "/orders", label: "Mis cosas", match: ["/orders", "/academy"] },
  { href: "/dashboard", label: "Yo", match: ["/dashboard", "/wallet", "/studio", "/notifications"] },
];

export function PlatformNav({ tone = "page" }: { tone?: "page" | "video" }) {
  const pathname = usePathname();
  const onVideo = tone === "video";

  return (
    <nav className="hidden items-center gap-5 md:flex">
      {links.map((link) => {
        const active = link.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-semibold transition ${
              onVideo
                ? active
                  ? "text-[#7dd3ff] [text-shadow:0_1px_10px_rgba(0,0,0,0.95),0_0_18px_rgba(0,0,0,0.7)]"
                  : "text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.95),0_0_18px_rgba(0,0,0,0.7)] hover:text-white"
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
