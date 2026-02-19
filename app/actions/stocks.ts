"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { getMarketDataProvider } from "@/lib/providers";
import { revalidatePath } from "next/cache";
import { Timeframe } from "@/lib/providers/types";

export async function getUserStocks(includeArchived = false) {
  const user = await requireAuth();

  const userStocks = await prisma.userStock.findMany({
    where: {
      userId: user.id,
      deletedAt: null, // exclude soft-deleted stocks
      ...(includeArchived ? {} : { archivedAt: null }),
    },
    include: {
      stock: true,
      tags: {
        include: {
          tag: true,
        },
      },
      notes: {
        where: { deletedAt: null }, // only active notes
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: { notes: true }, // total notes including soft-deleted (for warnings)
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  return userStocks;
}

export async function addStockToWatchlist(stockData: {
  symbol: string;
  exchange: string;
  name: string;
  currency: string;
  country: string;
  type?: string;
}) {
  const user = await requireAuth();

  try {
    // Find or create stock
    let stock = await prisma.stock.findUnique({
      where: {
        symbol_exchange: {
          symbol: stockData.symbol,
          exchange: stockData.exchange,
        },
      },
    });

    if (!stock) {
      stock = await prisma.stock.create({
        data: stockData,
      });
    }

    // Check if already in user's watchlist
    const existing = await prisma.userStock.findUnique({
      where: {
        userId_stockId: {
          userId: user.id,
          stockId: stock.id,
        },
      },
    });

    if (existing) {
      // If archived, unarchive it
      if (existing.archivedAt) {
        await prisma.userStock.update({
          where: { id: existing.id },
          data: { archivedAt: null },
        });
      }
      revalidatePath("/dashboard");
      return { success: true, userStock: existing };
    }

    // Add to watchlist
    const userStock = await prisma.userStock.create({
      data: {
        userId: user.id,
        stockId: stock.id,
      },
      include: {
        stock: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    revalidatePath("/dashboard");
    return { success: true, userStock };
  } catch (error) {
    console.error("Failed to add stock:", error);
    return { success: false, error: "Failed to add stock to watchlist" };
  }
}

/**
 * Soft-deletes a stock from the watchlist.
 * All active notes are soft-deleted too (deletedAt = now).
 * Notes already in Recently Deleted are untouched.
 * Use this from the main watchlist. Use hardDeleteStock() for permanent removal.
 */
export async function removeStock(userStockId: string) {
  const user = await requireAuth();

  try {
    const userStock = await prisma.userStock.findFirst({
      where: { id: userStockId, userId: user.id, deletedAt: null },
    });

    if (!userStock) {
      return { success: false, error: "Stock not found" };
    }

    const now = new Date();

    // Soft-delete all active notes for this stock
    await prisma.note.updateMany({
      where: { userStockId, deletedAt: null },
      data: { deletedAt: now },
    });

    // Soft-delete the stock entry
    await prisma.userStock.update({
      where: { id: userStockId },
      data: { deletedAt: now },
    });

    revalidatePath("/dashboard");
    revalidatePath("/notes");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to remove stock" };
  }
}

/**
 * Permanently hard-deletes a stock and all its notes (cascade).
 * Use only from the Archive page's "Delete Forever" action.
 */
export async function hardDeleteStock(userStockId: string) {
  const user = await requireAuth();

  try {
    const userStock = await prisma.userStock.findFirst({
      where: { id: userStockId, userId: user.id },
    });

    if (!userStock) {
      return { success: false, error: "Stock not found" };
    }

    await prisma.userStock.delete({ where: { id: userStockId } });

    revalidatePath("/dashboard");
    revalidatePath("/archive");
    revalidatePath("/notes");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete stock" };
  }
}

export async function archiveStock(userStockId: string) {
  const user = await requireAuth();

  try {
    const userStock = await prisma.userStock.findFirst({
      where: {
        id: userStockId,
        userId: user.id,
      },
    });

    if (!userStock) {
      return { success: false, error: "Stock not found" };
    }

    await prisma.userStock.update({
      where: { id: userStockId },
      data: { archivedAt: new Date() },
    });

    revalidatePath("/dashboard");
    revalidatePath("/archive");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to archive stock" };
  }
}

export async function unarchiveStock(userStockId: string) {
  const user = await requireAuth();

  try {
    const userStock = await prisma.userStock.findFirst({
      where: {
        id: userStockId,
        userId: user.id,
      },
    });

    if (!userStock) {
      return { success: false, error: "Stock not found" };
    }

    await prisma.userStock.update({
      where: { id: userStockId },
      data: { archivedAt: null },
    });

    revalidatePath("/dashboard");
    revalidatePath("/archive");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to unarchive stock" };
  }
}

export async function searchStocks(query: string) {
  try {
    const provider = getMarketDataProvider();
    const results = await provider.search(query);
    return { success: true, results };
  } catch (error) {
    console.error("Search failed:", error);
    return { success: false, error: "Search failed", results: [] };
  }
}

function serializeQuote(quote: any) {
  return {
    symbol: quote.symbol,
    exchange: quote.exchange,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    timestamp: quote.timestamp instanceof Date ? quote.timestamp.toISOString() : quote.timestamp,
    volume: quote.volume,
    marketCap: quote.marketCap,
    high: quote.high,
    low: quote.low,
    open: quote.open,
    previousClose: quote.previousClose,
  };
}

export async function getStockQuote(symbol: string, exchange: string) {
  try {
    const provider = getMarketDataProvider();
    const quote = await provider.getQuote(symbol, exchange);
    return { success: true, quote: serializeQuote(quote) };
  } catch (error) {
    console.error("Failed to get quote:", error);
    return { success: false, error: "Failed to get quote" };
  }
}

export async function getBatchQuotes(stocks: Array<{ symbol: string; exchange: string }>) {
  try {
    const provider = getMarketDataProvider();
    const quotes = await provider.getBatchQuotes(stocks);
    const serialized: Record<string, any> = {};
    for (const [key, quote] of Array.from(quotes.entries())) {
      serialized[key] = serializeQuote(quote);
    }
    return { success: true, quotes: serialized };
  } catch (error) {
    console.error("Failed to get batch quotes:", error);
    return { success: false, error: "Failed to get quotes" };
  }
}

export async function getHistoricalData(
  symbol: string,
  exchange: string,
  timeframe: Timeframe
) {
  try {
    const provider = getMarketDataProvider();
    const candles = await provider.getHistoricalData(symbol, exchange, timeframe);
    // Serialize dates for client consumption
    const serialized = candles.map((c) => ({
      ...c,
      timestamp: c.timestamp.toISOString(),
    }));
    return { success: true, candles: serialized };
  } catch (error) {
    console.error("Failed to get historical data:", error);
    return { success: false, error: "Failed to get historical data", candles: [] };
  }
}
