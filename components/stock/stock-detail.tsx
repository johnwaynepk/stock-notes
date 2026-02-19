"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  Trash2,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PriceDisplay } from "@/components/stock/price-display";
import { StockChart } from "@/components/stock/stock-chart";
import { NoteTimeline } from "@/components/notes/note-timeline";
import { TagAssigner } from "@/components/tags/tag-assigner";
import { getStockQuote, archiveStock, removeStock } from "@/app/actions/stocks";
import { Timeframe } from "@/lib/providers/types";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const timeframes = [
  { label: "1D", value: Timeframe.ONE_DAY },
  { label: "1W", value: Timeframe.ONE_WEEK },
  { label: "1M", value: Timeframe.ONE_MONTH },
  { label: "3M", value: Timeframe.THREE_MONTHS },
  { label: "1Y", value: Timeframe.ONE_YEAR },
  { label: "5Y", value: Timeframe.FIVE_YEARS },
];

interface StockDetailProps {
  userStock: {
    id: string;
    stock: {
      symbol: string;
      exchange: string;
      name: string;
      currency: string;
      country: string;
      type: string | null;
    };
    tags: Array<{
      tag: {
        id: string;
        name: string;
        color: string;
      };
    }>;
    notes: Array<{
      id: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
    }>; // active notes only
    _count?: { notes: number }; // total including soft-deleted
  };
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

interface Quote {
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
}

export function StockDetail({ userStock, tags }: StockDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [timeframe, setTimeframe] = useState<Timeframe>(Timeframe.ONE_MONTH);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);

  const fetchQuote = useCallback(async () => {
    setQuoteLoading(true);
    const result = await getStockQuote(
      userStock.stock.symbol,
      userStock.stock.exchange
    );
    if (result.success && result.quote) {
      setQuote(result.quote as Quote);
    }
    setQuoteLoading(false);
  }, [userStock.stock.symbol, userStock.stock.exchange]);

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 30000);
    return () => clearInterval(interval);
  }, [fetchQuote]);

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveStock(userStock.id);
      if (result.success) {
        toast({ title: `${userStock.stock.symbol} archived` });
        router.push("/dashboard");
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await removeStock(userStock.id);
      if (result.success) {
        toast({ title: `${userStock.stock.symbol} removed` });
        router.push("/dashboard");
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const assignedTagIds = userStock.tags.map((t) => t.tag.id);

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{userStock.stock.symbol}</h1>
              <span className="text-sm text-muted-foreground">
                {userStock.stock.exchange}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {userStock.stock.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PriceDisplay
            price={quote?.price}
            change={quote?.change}
            changePercent={quote?.changePercent}
            currency={userStock.stock.currency}
            loading={quoteLoading}
            size="lg"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete {userStock.stock.symbol}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {(userStock._count?.notes ?? userStock.notes.length) > 0 ? (
                        <>
                          This stock has{" "}
                          <strong className="text-foreground">
                            {userStock.notes.length} active note
                            {userStock.notes.length !== 1 ? "s" : ""}
                          </strong>
                          . They will be moved to{" "}
                          <strong className="text-foreground">Recently Deleted</strong>{" "}
                          and kept for 90 days. Consider archiving instead to keep
                          the stock accessible.
                        </>
                      ) : (
                        "This stock will be removed from your watchlist."
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    {(userStock._count?.notes ?? userStock.notes.length) > 0 && (
                      <AlertDialogAction
                        onClick={handleArchive}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive Instead
                      </AlertDialogAction>
                    )}
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Stock
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tags */}
      <div className="border-b px-6 py-3">
        <TagAssigner
          userStockId={userStock.id}
          allTags={tags}
          assignedTagIds={assignedTagIds}
        />
      </div>

      {/* Timeframe selector */}
      <div className="flex gap-1 border-b px-6 py-3">
        {timeframes.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              timeframe === tf.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Chart + Tabs */}
      <div className="flex-1 px-6 py-4">
        <Tabs defaultValue="chart" className="w-full">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="notes">
              Notes ({userStock.notes.length})
            </TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-4">
            <StockChart
              symbol={userStock.stock.symbol}
              exchange={userStock.stock.exchange}
              timeframe={timeframe}
              notes={userStock.notes}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <NoteTimeline
              userStockId={userStock.id}
              initialNotes={userStock.notes}
            />
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {quote && (
                <>
                  {quote.open !== undefined && (
                    <InfoRow label="Open" value={`$${quote.open.toFixed(2)}`} />
                  )}
                  {quote.previousClose !== undefined && (
                    <InfoRow
                      label="Prev. Close"
                      value={`$${quote.previousClose.toFixed(2)}`}
                    />
                  )}
                  {quote.high !== undefined && (
                    <InfoRow label="High" value={`$${quote.high.toFixed(2)}`} />
                  )}
                  {quote.low !== undefined && (
                    <InfoRow label="Low" value={`$${quote.low.toFixed(2)}`} />
                  )}
                  {quote.volume !== undefined && (
                    <InfoRow
                      label="Volume"
                      value={quote.volume.toLocaleString()}
                    />
                  )}
                  {quote.marketCap !== undefined && (
                    <InfoRow
                      label="Market Cap"
                      value={`$${(quote.marketCap / 1e9).toFixed(2)}B`}
                    />
                  )}
                </>
              )}
              <InfoRow label="Currency" value={userStock.stock.currency} />
              <InfoRow label="Country" value={userStock.stock.country} />
              {userStock.stock.type && (
                <InfoRow
                  label="Type"
                  value={userStock.stock.type.toUpperCase()}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
