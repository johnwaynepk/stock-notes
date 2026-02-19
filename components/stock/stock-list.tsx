"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StockCard } from "@/components/stock/stock-card";
import { getBatchQuotes } from "@/app/actions/stocks";
import { motion, AnimatePresence } from "framer-motion";

interface Quote {
  price: number;
  change: number;
  changePercent: number;
}

interface StockListProps {
  stocks: Array<{
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
    notes: Array<{ id: string }>;
  }>;
}

export function StockList({ stocks }: StockListProps) {
  const searchParams = useSearchParams();
  const selectedStockId = searchParams.get("stock");
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    if (stocks.length === 0) {
      setLoading(false);
      return;
    }

    const stockPairs = stocks.map((s) => ({
      symbol: s.stock.symbol,
      exchange: s.stock.exchange,
    }));

    const result = await getBatchQuotes(stockPairs);
    if (result.success && result.quotes) {
      setQuotes(result.quotes as Record<string, Quote>);
    }
    setLoading(false);
  }, [stocks]);

  // Initial fetch
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Poll every 30s
  useEffect(() => {
    if (stocks.length === 0) return;
    const interval = setInterval(fetchQuotes, 30000);
    return () => clearInterval(interval);
  }, [fetchQuotes, stocks.length]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {stocks.map((userStock, i) => {
          const key = `${userStock.stock.symbol}:${userStock.stock.exchange}`;
          const quote = quotes[key];

          return (
            <motion.div
              key={userStock.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
            >
              <StockCard
                userStock={userStock}
                quote={quote}
                loading={loading}
                selected={selectedStockId === userStock.id}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
