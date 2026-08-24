import Link from "next/link";
import { LogoMark } from "@/components/brand/LogoMark";

type LogoProps = {
  href?: string;
  className?: string;
};

export function Logo({ href = "/", className = "" }: LogoProps) {
  const mark = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9 drop-shadow-[0_0_12px_rgba(0,240,255,0.35)]" />
      <span className="font-display text-lg font-extrabold tracking-tight text-white">
        Klik<span className="text-klik-cyan">Hubb</span>
      </span>
    </span>
  );

  if (!href) return mark;
  return (
    <Link href={href} className="shrink-0" aria-label="KlikHubb">
      {mark}
    </Link>
  );
}
