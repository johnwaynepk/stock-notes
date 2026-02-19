import { getUserStocks } from "@/app/actions/stocks";
import { ArchivedStockCard } from "@/components/stock/archived-stock-card";
import { Archive } from "lucide-react";

export default async function ArchivePage() {
  const archivedStocks = await getUserStocks(true);
  const archived = archivedStocks.filter((s) => s.archivedAt);

  return (
    <div className="h-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Archive</h1>
        <p className="text-sm text-muted-foreground">
          {archived.length} archived stock{archived.length !== 1 ? "s" : ""}
        </p>
      </div>

      {archived.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4">
            <Archive className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No archived stocks
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {archived.map((userStock) => (
            <ArchivedStockCard key={userStock.id} userStock={userStock} />
          ))}
        </div>
      )}
    </div>
  );
}
