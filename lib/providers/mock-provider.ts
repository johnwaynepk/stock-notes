import {
  IMarketDataProvider,
  SearchResult,
  Quote,
  Candle,
  Timeframe,
} from "./types";

/**
 * Mock provider for development and testing
 * Returns realistic-looking fake data
 */
export class MockProvider implements IMarketDataProvider {
  private mockStocks: SearchResult[] = [
    {
      symbol: "AAPL",
      exchange: "NASDAQ",
      name: "Apple Inc.",
      currency: "USD",
      country: "US",
      type: "stock",
    },
    {
      symbol: "TSLA",
      exchange: "NASDAQ",
      name: "Tesla, Inc.",
      currency: "USD",
      country: "US",
      type: "stock",
    },
    {
      symbol: "GOOGL",
      exchange: "NASDAQ",
      name: "Alphabet Inc.",
      currency: "USD",
      country: "US",
      type: "stock",
    },
    {
      symbol: "TSM",
      exchange: "NYSE",
      name: "Taiwan Semiconductor Manufacturing",
      currency: "USD",
      country: "TW",
      type: "stock",
    },
    {
      symbol: "ASML",
      exchange: "NASDAQ",
      name: "ASML Holding N.V.",
      currency: "USD",
      country: "NL",
      type: "stock",
    },
    {
      symbol: "SAP",
      exchange: "XETRA",
      name: "SAP SE",
      currency: "EUR",
      country: "DE",
      type: "stock",
    },
    {
      symbol: "NVDA",
      exchange: "NASDAQ",
      name: "NVIDIA Corporation",
      currency: "USD",
      country: "US",
      type: "stock",
    },
    {
      symbol: "MSFT",
      exchange: "NASDAQ",
      name: "Microsoft Corporation",
      currency: "USD",
      country: "US",
      type: "stock",
    },
  ];

  async search(query: string): Promise<SearchResult[]> {
    // Simulate API delay
    await this.delay(300);

    const lowerQuery = query.toLowerCase();
    return this.mockStocks.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(lowerQuery) ||
        stock.name.toLowerCase().includes(lowerQuery)
    );
  }

  async getQuote(symbol: string, exchange: string): Promise<Quote> {
    await this.delay(200);

    // Generate random price data
    const basePrice = this.getBasePrice(symbol);
    const change = (Math.random() - 0.5) * 20;
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      exchange,
      price: basePrice + change,
      change,
      changePercent,
      timestamp: new Date(),
      volume: Math.floor(Math.random() * 100000000),
      marketCap: basePrice * 1000000000 + Math.random() * 500000000000,
      high: basePrice + Math.abs(change) + Math.random() * 5,
      low: basePrice - Math.abs(change) - Math.random() * 5,
      open: basePrice + (Math.random() - 0.5) * 10,
      previousClose: basePrice,
    };
  }

  async getBatchQuotes(
    stocks: Array<{ symbol: string; exchange: string }>
  ): Promise<Map<string, Quote>> {
    await this.delay(500);

    const quotes = new Map<string, Quote>();
    for (const stock of stocks) {
      const quote = await this.getQuote(stock.symbol, stock.exchange);
      quotes.set(`${stock.symbol}:${stock.exchange}`, quote);
    }
    return quotes;
  }

  async getHistoricalData(
    symbol: string,
    exchange: string,
    timeframe: Timeframe
  ): Promise<Candle[]> {
    await this.delay(400);

    const periods = this.getPeriodsForTimeframe(timeframe);
    const basePrice = this.getBasePrice(symbol);
    const candles: Candle[] = [];

    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);

      const open = basePrice + (Math.random() - 0.5) * basePrice * 0.1;
      const close = open + (Math.random() - 0.5) * open * 0.05;
      const high = Math.max(open, close) + Math.random() * open * 0.02;
      const low = Math.min(open, close) - Math.random() * open * 0.02;
      const volume = Math.floor(Math.random() * 100000000);

      candles.push({
        timestamp: date,
        open,
        high,
        low,
        close,
        volume,
      });
    }

    return candles;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      AAPL: 175,
      TSLA: 250,
      GOOGL: 140,
      TSM: 100,
      ASML: 750,
      SAP: 150,
      NVDA: 500,
      MSFT: 380,
    };
    return prices[symbol] || 100;
  }

  private getPeriodsForTimeframe(timeframe: Timeframe): number {
    switch (timeframe) {
      case Timeframe.ONE_DAY:
        return 78; // 6.5 hours of trading * 12 (5-min candles)
      case Timeframe.ONE_WEEK:
        return 5; // 5 trading days
      case Timeframe.ONE_MONTH:
        return 21; // ~21 trading days
      case Timeframe.THREE_MONTHS:
        return 63; // ~63 trading days
      case Timeframe.ONE_YEAR:
        return 252; // ~252 trading days
      case Timeframe.FIVE_YEARS:
        return 60; // ~60 months
      default:
        return 30;
    }
  }
}
