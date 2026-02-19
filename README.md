# Stock Watchlist App

An Apple Stocks-inspired global stock watchlist application built with Next.js 14.

## Features

- 🌍 Global stock search (all exchanges, currencies, countries)
- 🏷️ Multi-tag organization with OR-based filtering
- 📝 Timestamped diary notes per stock
- 📊 Interactive price charts with multiple timeframes
- 📦 Archive stocks (preserves notes) or delete permanently
- 🔒 Secure authentication with NextAuth.js
- 🎨 Clean Apple-inspired UI

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server Actions)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5
- **UI**: shadcn/ui + Tailwind CSS + Framer Motion
- **Charts**: Recharts / Lightweight Charts
- **Market Data**: Pluggable provider interface (Alpha Vantage, Twelve Data, etc.)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Market data API key (Alpha Vantage, Twelve Data, or Finnhub)

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd stock-app
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and add your:
- Database URL
- NextAuth secret (generate with `openssl rand -base64 32`)
- Market data provider API key

4. Set up the database
```bash
npx prisma db push
npx prisma generate
```

5. Seed sample data (optional)
```bash
npm run db:seed
```

6. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
stock-app/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Main app (dashboard, archive, settings)
│   ├── actions/           # Server Actions
│   └── api/               # API routes (NextAuth)
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── stock/            # Stock-specific components
│   └── layout/           # Layout components
├── lib/                   # Utilities & business logic
│   ├── providers/        # Market data provider abstraction
│   ├── services/         # Business logic layer
│   └── utils/            # Helper functions
├── prisma/               # Database schema & migrations
└── public/               # Static assets
```

## Market Data Providers

The app uses a pluggable provider interface. Supported providers:

- **Alpha Vantage** (default, free tier available)
- **Twelve Data** (generous free tier)
- **Finnhub** (good for US stocks)
- **Mock** (for development)

Switch providers by changing `MARKET_DATA_PROVIDER` in `.env`.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- AWS Amplify
- Docker + VPS

## Development

```bash
# Run dev server
npm run dev

# Run database studio
npm run db:studio

# Generate Prisma client
npm run db:generate

# Create migration
npm run db:migrate

# Lint
npm run lint
```

## License

MIT

## Credits

Design inspired by Apple Stocks
