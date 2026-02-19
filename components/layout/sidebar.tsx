"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, Search, Archive, Settings, X, Menu, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SidebarStock {
  id: string;
  stock: {
    symbol: string;
    exchange: string;
    name: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

interface SidebarTag {
  id: string;
  name: string;
  color: string;
}

interface SidebarProps {
  stocks: SidebarStock[];
  tags: SidebarTag[];
  onSearchOpen: () => void;
}

export function Sidebar({ stocks, tags, onSearchOpen }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedStockId = searchParams.get("stock");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredStocks = activeTag
    ? stocks.filter((s) => s.tags.some((t) => t.tag.id === activeTag))
    : stocks;

  const selectStock = (stockId: string) => {
    router.push(`/dashboard?stock=${stockId}`);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Logo & Search */}
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Watchlist</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSearchOpen}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Tag filter pills */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 py-3">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
              !activeTag
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                activeTag === tag.id
                  ? "text-white"
                  : "text-secondary-foreground hover:opacity-80"
              )}
              style={{
                backgroundColor:
                  activeTag === tag.id ? tag.color : tag.color + "20",
                color: activeTag === tag.id ? "#fff" : tag.color,
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {tags.length > 0 && <Separator />}

      {/* Stock list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredStocks.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              {stocks.length === 0
                ? "No stocks yet. Search to add."
                : "No stocks match this filter."}
            </div>
          ) : (
            filteredStocks.map((userStock) => (
              <button
                key={userStock.id}
                onClick={() => selectStock(userStock.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors",
                  selectedStockId === userStock.id
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                )}
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm">
                    {userStock.stock.symbol}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {userStock.stock.name}
                  </div>
                </div>
                <div className="ml-2 text-right text-xs text-muted-foreground">
                  {userStock.stock.exchange}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Nav links */}
      <div className="p-2">
        <Link href="/notes" onClick={() => setMobileOpen(false)}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 text-sm",
              pathname === "/notes" && "bg-accent"
            )}
            size="sm"
          >
            <StickyNote className="h-4 w-4" />
            Notes
          </Button>
        </Link>
        <Link href="/archive" onClick={() => setMobileOpen(false)}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 text-sm",
              pathname === "/archive" && "bg-accent"
            )}
            size="sm"
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </Link>
        <Link href="/settings" onClick={() => setMobileOpen(false)}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 text-sm",
              pathname === "/settings" && "bg-accent"
            )}
            size="sm"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="px-4 pb-3">
        <button
          onClick={onSearchOpen}
          className="flex w-full items-center gap-2 rounded-md border border-border/50 bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Search className="h-3 w-3" />
          Search stocks...
          <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="fixed left-0 top-0 z-40 flex h-14 w-full items-center border-b bg-background px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="ml-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <span className="font-semibold text-sm">Watchlist</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop always visible, mobile toggled */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 flex h-full w-[280px] flex-col border-r bg-background transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
