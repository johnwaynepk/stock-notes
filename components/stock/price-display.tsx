import { formatCurrency, formatPercent, getChangeClass } from "@/lib/utils";

interface PriceDisplayProps {
  price?: number;
  change?: number;
  changePercent?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function PriceDisplay({
  price,
  change,
  changePercent,
  currency = "USD",
  size = "md",
  loading = false,
}: PriceDisplayProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div
          className={
            size === "lg"
              ? "mb-1 h-8 w-28 rounded bg-muted"
              : size === "md"
                ? "mb-1 h-6 w-20 rounded bg-muted"
                : "mb-0.5 h-4 w-16 rounded bg-muted"
          }
        />
        <div
          className={
            size === "lg"
              ? "h-5 w-24 rounded bg-muted"
              : size === "md"
                ? "h-4 w-16 rounded bg-muted"
                : "h-3 w-14 rounded bg-muted"
          }
        />
      </div>
    );
  }

  if (price === undefined) {
    return (
      <div className="text-xs text-muted-foreground">--</div>
    );
  }

  const changeClass = getChangeClass(change ?? 0);

  const textSizes = {
    sm: { price: "text-sm font-medium", change: "text-xs" },
    md: { price: "text-base font-semibold", change: "text-sm" },
    lg: { price: "text-3xl font-bold", change: "text-base" },
  };

  return (
    <div className="text-right">
      <div className={textSizes[size].price}>
        {formatCurrency(price, currency)}
      </div>
      {change !== undefined && changePercent !== undefined && (
        <div className={`${textSizes[size].change} ${changeClass}`}>
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)} ({formatPercent(changePercent)})
        </div>
      )}
    </div>
  );
}
