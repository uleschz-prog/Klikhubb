import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { brand } from "@/config/site";

const columns = [
  {
    title: "Producto",
    links: [
      { href: "/feed", label: "Feed" },
      { href: "/marketplace", label: "Marketplace" },
      { href: "/academy", label: "Academy" },
      { href: "/community", label: "Community" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Términos" },
      { href: "/legal/privacy", label: "Privacidad" },
      { href: "/legal/cookies", label: "Cookies" },
    ],
  },
  {
    title: "Redes",
    links: [
      { href: "https://x.com", label: "X" },
      { href: "https://instagram.com", label: "Instagram" },
      { href: "https://linkedin.com", label: "LinkedIn" },
      { href: "https://tiktok.com", label: "TikTok" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-klik-line bg-black">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/50">{brand.slogan}</p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">{column.title}</p>
            <ul className="mt-4 space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition hover:text-klik-cyan"
                    {...(link.href.startsWith("http")
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 py-4 text-center text-[11px] text-white/35">
        © {new Date().getFullYear()} KlikHubb. Todos los derechos reservados.
      </div>
    </footer>
  );
}
