"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchStocks, addStockToWatchlist } from "@/app/actions/stocks";
import { useToast } from "@/components/ui/use-toast";

interface SearchResult {
  symbol: string;
  exchange: string;
  name: string;
  currency: string;
  country: string;
  type?: string;
}

interface StockSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockSearch({ open, onOpenChange }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Cmd+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 1) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const result = await searchStocks(query);
      if (result.success && result.results) {
        setResults(result.results);
      }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setAddingSymbol(null);
    }
  }, [open]);

  const handleAdd = useCallback(
    async (stock: SearchResult) => {
      setAddingSymbol(stock.symbol);
      startTransition(async () => {
        const result = await addStockToWatchlist({
          symbol: stock.symbol,
          exchange: stock.exchange,
          name: stock.name,
          currency: stock.currency,
          country: stock.country,
          type: stock.type,
        });

        if (result.success) {
          toast({
            title: "Stock added",
            description: `${stock.symbol} added to your watchlist`,
          });
          onOpenChange(false);
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to add stock",
            variant: "destructive",
          });
        }
        setAddingSymbol(null);
      });
    },
    [onOpenChange, router, toast]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search stocks by symbol or name..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!searching && query.length > 0 && results.length === 0 && (
          <CommandEmpty>No stocks found.</CommandEmpty>
        )}
        {searching && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
          </div>
        )}
        {results.length > 0 && (
          <CommandGroup heading="Results">
            {results.map((stock) => (
              <CommandItem
                key={`${stock.symbol}:${stock.exchange}`}
                value={`${stock.symbol} ${stock.name}`}
                onSelect={() => handleAdd(stock)}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stock.symbol}</span>
                    <span className="text-xs text-muted-foreground">
                      {stock.exchange}
                    </span>
                    {stock.country && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {stock.country}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {stock.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {addingSymbol === stock.symbol ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
