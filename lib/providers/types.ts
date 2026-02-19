export interface SearchResult {
  symbol: string;
  exchange: string;
  name: string;
  currency: string;
  country: string;
  type?: string; // "stock" | "etf" | "index"
}

export interface Quote {
  symbol: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  volume?: number;
  marketCap?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
}

export interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export enum Timeframe {
  ONE_DAY = "1D",
  ONE_WEEK = "1W",
  ONE_MONTH = "1M",
  THREE_MONTHS = "3M",
  ONE_YEAR = "1Y",
  FIVE_YEARS = "5Y",
}

export interface IMarketDataProvider {
  /**
   * Search for stocks globally by query
   * @param query - Search term (symbol or company name)
   * @returns Array of matching stocks
   */
  search(query: string): Promise<SearchResult[]>;

  /**
   * Get current quote for a stock
   * @param symbol - Stock symbol
   * @param exchange - Exchange code
   * @returns Current quote data
   */
  getQuote(symbol: string, exchange: string): Promise<Quote>;

  /**
   * Get batch quotes for multiple stocks (optimization)
   * @param stocks - Array of {symbol, exchange} pairs
   * @returns Map of "symbol:exchange" to Quote
   */
  getBatchQuotes(
    stocks: Array<{ symbol: string; exchange: string }>
  ): Promise<Map<string, Quote>>;

  /**
   * Get historical price data
   * @param symbol - Stock symbol
   * @param exchange - Exchange code
   * @param timeframe - Time range
   * @returns Array of candles
   */
  getHistoricalData(
    symbol: string,
    exchange: string,
    timeframe: Timeframe
  ): Promise<Candle[]>;

  /**
   * Check provider health/availability
   * @returns True if provider is operational
   */
  healthCheck(): Promise<boolean>;
}
