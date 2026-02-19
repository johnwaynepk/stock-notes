"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal, Archive, Trash2, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceDisplay } from "@/components/stock/price-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { archiveStock, removeStock } from "@/app/actions/stocks";
import { useToast } from "@/components/ui/use-toast";
import { useTransition } from "react";

interface Quote {
  price: number;
  change: number;
  changePercent: number;
}

interface StockCardProps {
  userStock: {
    id: string;
    stock: {
      symbol: string;
      exchange: string;
      name: string;
      currency: string;
    };
    tags: Array<{
      tag: {
        id: string;
        name: string;
        color: string;
      };
    }>;
    notes: Array<{ id: string }>; // active notes only
    _count?: { notes: number };   // total including soft-deleted
  };
  quote?: Quote;
  loading?: boolean;
  selected?: boolean;
}

export function StockCard({
  userStock,
  quote,
  loading = false,
  selected = false,
}: StockCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveStock(userStock.id);
      if (result.success) {
        toast({ title: `${userStock.stock.symbol} archived` });
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

  return (
    <div
      onClick={() => router.push(`/dashboard?stock=${userStock.id}`)}
      className={cn(
        "group relative cursor-pointer rounded-xl border p-4 transition-all hover:bg-accent/50",
        selected && "border-primary/30 bg-accent",
        isPending && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{userStock.stock.symbol}</span>
            <span className="text-xs text-muted-foreground">
              {userStock.stock.exchange}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {userStock.stock.name}
          </p>
        </div>

        <PriceDisplay
          price={quote?.price}
          change={quote?.change}
          changePercent={quote?.changePercent}
          currency={userStock.stock.currency}
          loading={loading}
          size="sm"
        />
      </div>

      {/* Tags & notes indicator */}
      <div className="mt-2 flex items-center gap-1.5">
        {userStock.tags.slice(0, 3).map(({ tag }) => (
          <span
            key={tag.id}
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: tag.color + "20",
              color: tag.color,
            }}
          >
            {tag.name}
          </span>
        ))}
        {userStock.tags.length > 3 && (
          <span className="text-[10px] text-muted-foreground">
            +{userStock.tags.length - 3}
          </span>
        )}
        {userStock.notes.length > 0 && (
          <span className="ml-auto flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <StickyNote className="h-3 w-3" />
            {userStock.notes.length}
          </span>
        )}
      </div>

      {/* Actions dropdown */}
      <div
        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
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
                  <AlertDialogTitle>Delete {userStock.stock.symbol}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {(userStock._count?.notes ?? userStock.notes.length) > 0 ? (
                      <>
                        This stock has{" "}
                        <strong className="text-foreground">
                          {userStock.notes.length} active note{userStock.notes.length !== 1 ? "s" : ""}
                        </strong>
                        . They will be moved to{" "}
                        <strong className="text-foreground">Recently Deleted</strong> and kept for 90 days.
                        Consider archiving instead to keep the stock accessible.
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
  );
}
