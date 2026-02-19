import { IMarketDataProvider } from "./types";
import { AlphaVantageProvider } from "./alpha-vantage-provider";
import { FinnhubProvider } from "./finnhub-provider";
import { MockProvider } from "./mock-provider";

export enum ProviderType {
  ALPHA_VANTAGE = "alpha_vantage",
  TWELVE_DATA = "twelve_data",
  FINNHUB = "finnhub",
  POLYGON = "polygon",
  MOCK = "mock",
}

export function createMarketDataProvider(type?: ProviderType): IMarketDataProvider {
  const providerType =
    type || (process.env.MARKET_DATA_PROVIDER as ProviderType) || ProviderType.MOCK;

  switch (providerType) {
    case ProviderType.ALPHA_VANTAGE: {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey || apiKey === "your-alpha-vantage-api-key") {
        console.warn("ALPHA_VANTAGE_API_KEY not set, falling back to mock provider");
        return new MockProvider();
      }
      return new AlphaVantageProvider(apiKey);
    }

    case ProviderType.FINNHUB: {
      const apiKey = process.env.FINNHUB_API_KEY;
      if (!apiKey || apiKey === "your-finnhub-api-key") {
        console.warn("FINNHUB_API_KEY not set, falling back to mock provider");
        return new MockProvider();
      }
      return new FinnhubProvider(apiKey);
    }

    case ProviderType.MOCK:
      return new MockProvider();

    default:
      console.warn(`Unknown provider type: ${providerType}, using mock provider`);
      return new MockProvider();
  }
}

// Singleton instance
let providerInstance: IMarketDataProvider | null = null;

export function getMarketDataProvider(): IMarketDataProvider {
  if (!providerInstance) {
    providerInstance = createMarketDataProvider();
  }
  return providerInstance;
}
