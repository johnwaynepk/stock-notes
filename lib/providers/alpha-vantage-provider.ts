import {
  IMarketDataProvider,
  SearchResult,
  Quote,
  Candle,
  Timeframe,
} from "./types";

/**
 * Alpha Vantage provider implementation
 * Docs: https://www.alphavantage.co/documentation/
 */
export class AlphaVantageProvider implements IMarketDataProvider {
  private baseUrl = "https://www.alphavantage.co/query";
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Alpha Vantage API key is required");
    }
    this.apiKey = apiKey;
  }

  async search(query: string): Promise<SearchResult[]> {
    const url = new URL(this.baseUrl);
    url.searchParams.append("function", "SYMBOL_SEARCH");
    url.searchParams.append("keywords", query);
    url.searchParams.append("apikey", this.apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.Note || data["Error Message"]) {
      throw new Error(data.Note || data["Error Message"]);
    }

    const matches = data.bestMatches || [];
    return matches.map((match: any) => ({
      symbol: match["1. symbol"],
      exchange: match["4. region"] || "US",
      name: match["2. name"],
      currency: match["8. currency"] || "USD",
      country: match["4. region"] || "US",
      type: match["3. type"]?.toLowerCase(),
    }));
  }

  async getQuote(symbol: string, exchange: string): Promise<Quote> {
    const url = new URL(this.baseUrl);
    url.searchParams.append("function", "GLOBAL_QUOTE");
    url.searchParams.append("symbol", symbol);
    url.searchParams.append("apikey", this.apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.Note || data["Error Message"]) {
      throw new Error(data.Note || data["Error Message"]);
    }

    const quote = data["Global Quote"];
    if (!quote) {
      throw new Error(`No quote data found for ${symbol}`);
    }

    const price = parseFloat(quote["05. price"]);
    const previousClose = parseFloat(quote["08. previous close"]);
    const change = parseFloat(quote["09. change"]);
    const changePercent = parseFloat(quote["10. change percent"].replace("%", ""));

    return {
      symbol,
      exchange,
      price,
      change,
      changePercent,
      timestamp: new Date(),
      volume: parseInt(quote["06. volume"]),
      high: parseFloat(quote["03. high"]),
      low: parseFloat(quote["04. low"]),
      open: parseFloat(quote["02. open"]),
      previousClose,
    };
  }

  async getBatchQuotes(
    stocks: Array<{ symbol: string; exchange: string }>
  ): Promise<Map<string, Quote>> {
    // Alpha Vantage doesn't support batch quotes, so we make individual requests
    // In production, you'd want to implement rate limiting here
    const quotes = new Map<string, Quote>();

    for (const stock of stocks) {
      try {
        const quote = await this.getQuote(stock.symbol, stock.exchange);
        quotes.set(`${stock.symbol}:${stock.exchange}`, quote);
        // Add small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Failed to fetch quote for ${stock.symbol}:`, error);
      }
    }

    return quotes;
  }

  async getHistoricalData(
    symbol: string,
    exchange: string,
    timeframe: Timeframe
  ): Promise<Candle[]> {
    const functionName = this.getFunctionForTimeframe(timeframe);

    const url = new URL(this.baseUrl);
    url.searchParams.append("function", functionName);
    url.searchParams.append("symbol", symbol);
    url.searchParams.append("apikey", this.apiKey);

    if (timeframe === Timeframe.ONE_DAY) {
      url.searchParams.append("interval", "5min");
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.Note || data["Error Message"]) {
      throw new Error(data.Note || data["Error Message"]);
    }

    const timeSeriesKey = Object.keys(data).find((key) => key.includes("Time Series"));
    if (!timeSeriesKey) {
      throw new Error(`No time series data found for ${symbol}`);
    }

    const timeSeries = data[timeSeriesKey];
    const candles: Candle[] = [];

    for (const [timestamp, values] of Object.entries(timeSeries)) {
      candles.push({
        timestamp: new Date(timestamp),
        open: parseFloat((values as any)["1. open"]),
        high: parseFloat((values as any)["2. high"]),
        low: parseFloat((values as any)["3. low"]),
        close: parseFloat((values as any)["4. close"]),
        volume: parseInt((values as any)["5. volume"]),
      });
    }

    return candles.reverse(); // Alpha Vantage returns newest first
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.append("function", "GLOBAL_QUOTE");
      url.searchParams.append("symbol", "AAPL");
      url.searchParams.append("apikey", this.apiKey);

      const response = await fetch(url.toString());
      return response.ok;
    } catch {
      return false;
    }
  }

  private getFunctionForTimeframe(timeframe: Timeframe): string {
    switch (timeframe) {
      case Timeframe.ONE_DAY:
        return "TIME_SERIES_INTRADAY";
      case Timeframe.ONE_WEEK:
      case Timeframe.ONE_MONTH:
        return "TIME_SERIES_DAILY";
      case Timeframe.THREE_MONTHS:
      case Timeframe.ONE_YEAR:
      case Timeframe.FIVE_YEARS:
        return "TIME_SERIES_WEEKLY";
      default:
        return "TIME_SERIES_DAILY";
    }
  }
}
