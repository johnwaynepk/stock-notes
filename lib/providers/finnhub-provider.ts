import {
  IMarketDataProvider,
  SearchResult,
  Quote,
  Candle,
  Timeframe,
} from "./types";

/**
 * FinnHub provider implementation
 * Free tier: 60 API calls/min, global stock data
 * Docs: https://finnhub.io/docs/api
 */
export class FinnhubProvider implements IMarketDataProvider {
  private baseUrl = "https://finnhub.io/api/v1";
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("FinnHub API key is required");
    }
    this.apiKey = apiKey;
  }

  async search(query: string): Promise<SearchResult[]> {
    const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&token=${this.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.result) {
      return [];
    }

    return data.result
      .filter((item: any) => item.type === "Common Stock" || item.type === "ETP" || item.type === "ADR")
      .slice(0, 15)
      .map((item: any) => {
        const exchange = this.parseExchange(item.displaySymbol, item.description);
        const country = this.exchangeToCountry(exchange);
        return {
          symbol: item.symbol,
          exchange,
          name: item.description,
          currency: this.exchangeToCurrency(exchange),
          country,
          type: item.type === "ETP" ? "etf" : "stock",
        };
      });
  }

  async getQuote(symbol: string, exchange: string): Promise<Quote> {
    const url = `${this.baseUrl}/quote?symbol=${encodeURIComponent(symbol)}&token=${this.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data || data.c === 0) {
      throw new Error(`No quote data for ${symbol}`);
    }

    return {
      symbol,
      exchange,
      price: data.c, // current
      change: data.d, // change
      changePercent: data.dp, // change percent
      timestamp: new Date(data.t * 1000),
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
    };
  }

  async getBatchQuotes(
    stocks: Array<{ symbol: string; exchange: string }>
  ): Promise<Map<string, Quote>> {
    const quotes = new Map<string, Quote>();

    // FinnHub supports individual quote calls - batch them with small delays
    for (const stock of stocks) {
      try {
        const quote = await this.getQuote(stock.symbol, stock.exchange);
        quotes.set(`${stock.symbol}:${stock.exchange}`, quote);
        // Small delay to respect rate limits (60/min = 1/sec)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to fetch quote for ${stock.symbol}:`, error);
      }
    }

    return quotes;
  }

  async getHistoricalData(
    symbol: string,
    _exchange: string,
    timeframe: Timeframe
  ): Promise<Candle[]> {
    // FinnHub free tier doesn't support candle data.
    // Use Yahoo Finance's free chart endpoint as fallback.
    const { range, interval } = this.getYahooParams(timeframe);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const data = await response.json();

    const result = data?.chart?.result?.[0];
    if (!result || !result.timestamp) {
      return [];
    }

    const timestamps: number[] = result.timestamp;
    const quote = result.indicators?.quote?.[0];
    if (!quote) return [];

    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = quote.close?.[i];
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];
      const volume = quote.volume?.[i];
      // Skip null entries (e.g. weekends/holidays)
      if (close == null || open == null) continue;
      candles.push({
        timestamp: new Date(timestamps[i] * 1000),
        open,
        high: high ?? open,
        low: low ?? open,
        close,
        volume: volume ?? 0,
      });
    }

    return candles;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/quote?symbol=AAPL&token=${this.apiKey}`;
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  private getYahooParams(timeframe: Timeframe): {
    range: string;
    interval: string;
  } {
    switch (timeframe) {
      case Timeframe.ONE_DAY:
        return { range: "1d", interval: "5m" };
      case Timeframe.ONE_WEEK:
        return { range: "5d", interval: "15m" };
      case Timeframe.ONE_MONTH:
        return { range: "1mo", interval: "1d" };
      case Timeframe.THREE_MONTHS:
        return { range: "3mo", interval: "1d" };
      case Timeframe.ONE_YEAR:
        return { range: "1y", interval: "1wk" };
      case Timeframe.FIVE_YEARS:
        return { range: "5y", interval: "1mo" };
      default:
        return { range: "1mo", interval: "1d" };
    }
  }

  private parseExchange(displaySymbol: string, description: string): string {
    // FinnHub uses formats like "AAPL" (US) or "SHOP.TO" (Toronto)
    if (displaySymbol.includes(".")) {
      const suffix = displaySymbol.split(".").pop()?.toUpperCase();
      const exchangeMap: Record<string, string> = {
        TO: "TSX",
        V: "TSXV",
        L: "LSE",
        AS: "AMS",
        PA: "EPA",
        DE: "XETRA",
        F: "FRA",
        MI: "BIT",
        MC: "BME",
        SW: "SIX",
        HK: "HKEX",
        T: "TSE",
        SS: "SSE",
        SZ: "SZSE",
        AX: "ASX",
        NS: "NSE",
        BO: "BSE",
        SA: "B3",
        KS: "KRX",
        TW: "TWSE",
      };
      return exchangeMap[suffix || ""] || suffix || "US";
    }
    return "US";
  }

  private exchangeToCountry(exchange: string): string {
    const map: Record<string, string> = {
      US: "US", NASDAQ: "US", NYSE: "US",
      TSX: "CA", TSXV: "CA",
      LSE: "GB",
      AMS: "NL", EPA: "FR", XETRA: "DE", FRA: "DE",
      BIT: "IT", BME: "ES", SIX: "CH",
      HKEX: "HK", TSE: "JP", SSE: "CN", SZSE: "CN",
      ASX: "AU", NSE: "IN", BSE: "IN",
      B3: "BR", KRX: "KR", TWSE: "TW",
    };
    return map[exchange] || "US";
  }

  private exchangeToCurrency(exchange: string): string {
    const map: Record<string, string> = {
      US: "USD", NASDAQ: "USD", NYSE: "USD",
      TSX: "CAD", TSXV: "CAD",
      LSE: "GBP",
      AMS: "EUR", EPA: "EUR", XETRA: "EUR", FRA: "EUR",
      BIT: "EUR", BME: "EUR",
      SIX: "CHF",
      HKEX: "HKD", TSE: "JPY", SSE: "CNY", SZSE: "CNY",
      ASX: "AUD", NSE: "INR", BSE: "INR",
      B3: "BRL", KRX: "KRW", TWSE: "TWD",
    };
    return map[exchange] || "USD";
  }
}
