import { formatCatalogPrice } from "@/lib/commerce/display-fx";

type PriceTagProps = {
  amount: number;
  currency?: string;
  fx?: number;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right" | "center";
  className?: string;
  compact?: boolean;
};

export function PriceTag({
  amount,
  currency = "USD",
  fx,
  size = "md",
  align = "left",
  className = "",
  compact = false,
}: PriceTagProps) {
  const price = formatCatalogPrice(amount, currency, fx);
  const alignClass = align === "right" ? "items-end text-right" : align === "center" ? "items-center text-center" : "items-start text-left";
  const primaryClass =
    size === "lg" ? "text-2xl font-extrabold" : size === "sm" ? "text-sm font-bold" : "text-base font-bold";
  const secondaryClass = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <span className={`inline-flex flex-col leading-tight ${alignClass} ${className}`}>
      <span className={primaryClass}>{price.primary}</span>
      {price.secondary ? (
        <span className={`${secondaryClass} text-current/55`}>
          {price.secondary}
          {price.approximate ? (compact ? " · aprox." : " · cambio aproximado") : ""}
        </span>
      ) : null}
    </span>
  );
}
