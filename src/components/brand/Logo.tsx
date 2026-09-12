import Link from "next/link";
import { LogoMark } from "@/components/brand/LogoMark";
import { brand } from "@/config/site";

type LogoProps = {
  href?: string | null;
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
};

/** Logo Qlyk. El texto hereda `currentColor` para claro/oscuro. */
export function Logo({
  href = "/",
  className = "",
  markClassName = "h-8 w-8",
  showWordmark = true,
}: LogoProps) {
  const mark = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markClassName} />
      {showWordmark ? (
        <span className="text-[17px] font-semibold tracking-tight">
          {brand.name}
        </span>
      ) : null}
    </span>
  );

  if (!href) return mark;
  return (
    <Link href={href} className="shrink-0 text-inherit" aria-label={brand.name}>
      {mark}
    </Link>
  );
}
