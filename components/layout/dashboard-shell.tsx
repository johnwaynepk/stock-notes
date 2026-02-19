"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { StockSearch } from "@/components/search/stock-search";

interface DashboardShellProps {
  stocks: any[];
  tags: any[];
  children: React.ReactNode;
}

export function DashboardShell({ stocks, tags, children }: DashboardShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        stocks={stocks}
        tags={tags}
        onSearchOpen={() => setSearchOpen(true)}
      />
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">{children}</main>
      <StockSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
