import { getUserStocks } from "@/app/actions/stocks";
import { getUserTags } from "@/app/actions/tags";
import { StockList } from "@/components/stock/stock-list";
import { StockDetail } from "@/components/stock/stock-detail";
import { TrendingUp, Search } from "lucide-react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { stock?: string };
}) {
  const stocks = await getUserStocks();
  const tags = await getUserTags();
  const selectedStockId = searchParams.stock;

  const selectedStock = selectedStockId
    ? stocks.find((s) => s.id === selectedStockId)
    : null;

  if (selectedStock) {
    return (
      <div className="h-full">
        <StockDetail
          userStock={selectedStock}
          tags={tags}
        />
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      {stocks.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Welcome to Stock Watchlist</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Get started by adding stocks to your watchlist. Press{" "}
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
              ⌘K
            </kbd>{" "}
            to search.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Watchlist</h1>
            <p className="text-sm text-muted-foreground">
              {stocks.length} stock{stocks.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
          <StockList stocks={stocks} />
        </>
      )}
    </div>
  );
}
