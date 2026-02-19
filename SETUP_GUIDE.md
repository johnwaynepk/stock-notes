# Stock Watchlist - Setup & Completion Guide

## 🎉 Current Status

The codebase has been generated with core functionality! Here's what's included:

### ✅ Completed Features

1. **Configuration & Setup**
   - Next.js 14 with TypeScript
   - Prisma ORM with PostgreSQL schema
   - NextAuth.js authentication
   - Tailwind CSS + shadcn/ui components
   - Market data provider abstraction (Mock & Alpha Vantage)

2. **Authentication**
   - Login/Signup pages
   - Session management
   - Protected routes

3. **Database Schema**
   - Users, Stocks, UserStocks
   - Tags, UserStockTags
   - Notes (with cascade delete)
   - Seeding script with demo data

4. **Server Actions**
   - Auth (signup)
   - Stocks (add, remove, archive, search, quotes)
   - Tags (create, update, delete, assign)
   - Notes (create, update, delete, list)

5. **Basic Dashboard**
   - Stock list view
   - Tag overview
   - Archive page
   - Settings page

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure:

```bash
# Database (use Neon, Supabase, or local PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/stockwatchlist"

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# Market Data Provider (start with mock, then add real API key)
MARKET_DATA_PROVIDER="mock"
ALPHA_VANTAGE_API_KEY="" # Optional: get free key from alphavantage.co
```

### 3. Set Up Database

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed demo data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 5. Login with Demo Account

```
Email: demo@example.com
Password: demo123
```

## 📋 Features to Complete

### Priority 1: Essential UI Components

Create the missing shadcn/ui components:

```bash
# Run these commands or manually create the component files

npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add command
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
```

Or manually copy from: https://ui.shadcn.com/docs/components

### Priority 2: Stock Detail View & Chart

**File: `components/stock/stock-detail.tsx`**

Build the main detail view that shows:
- Stock header (symbol, price, change%)
- Interactive chart with timeframe selector
- Company info (exchange, currency, country)
- Tag management
- Notes timeline

**File: `components/stock/stock-chart.tsx`**

Implement chart using Recharts or Lightweight Charts:
- Fetch historical data via `getHistoricalData` server action
- Support 1D, 1W, 1M, 3M, 1Y, 5Y timeframes
- Color-code positive (green) / negative (red) changes
- Responsive design

### Priority 3: Global Search

**File: `components/search/global-search.tsx`**

Create a command palette (Cmd+K):
- Use `components/ui/command.tsx`
- Call `searchStocks()` server action
- Show results with symbol, exchange, currency, country
- Handle adding to watchlist
- Prevent duplicates

### Priority 4: Tag System

**File: `components/tags/tag-filter.tsx`**

Multi-select checkboxes for filtering stocks:
- Show all tags with counts
- OR logic (stocks with any selected tag)
- Highlight active filters
- Clear all button

**File: `components/tags/tag-manager.tsx`**

Tag CRUD interface:
- Create tag with color picker
- Edit tag name/color
- Delete tag (with confirmation)
- Assign tags to stocks

### Priority 5: Notes Timeline

**File: `components/notes/note-timeline.tsx`**

Chronological note display:
- Show timestamp + content
- Edit/delete buttons
- Markdown support (optional)
- Auto-save drafts (localStorage)

**File: `components/notes/note-editor.tsx`**

Note creation/editing:
- Textarea with auto-resize
- Save/cancel buttons
- Character count (optional)

### Priority 6: Delete/Archive Modals

**File: `components/stock/delete-confirmation.tsx`**

Use `components/ui/alert-dialog.tsx`:
- Check if notes exist
- Show warning: "⚠️ This will delete X notes"
- Buttons: [Cancel] [Archive] [Delete Permanently]
- Call `removeStock()` or `archiveStock()`

### Priority 7: Real-time Price Updates

Add polling or WebSocket support:
- Fetch batch quotes every 5 seconds (when dashboard visible)
- Update prices optimistically
- Show "last updated" timestamp
- Handle API errors gracefully

### Priority 8: Sidebar Layout

**File: `components/layout/sidebar.tsx`**

Create Apple Stocks-style sidebar:
- Tag filter section (top)
- Stock list (scrollable)
- Selected stock highlighted
- Drag-to-reorder (optional)

Update `app/(dashboard)/dashboard/page.tsx` to use sidebar layout.

### Priority 9: Animations & Polish

Add Framer Motion animations:
- Page transitions
- Stock card hover effects
- Tag filter animations
- Chart interactions
- Loading skeletons

### Priority 10: Additional Providers

Implement additional market data providers:

**File: `lib/providers/twelve-data-provider.ts`**
**File: `lib/providers/finnhub-provider.ts`**

Follow the same interface as `AlphaVantageProvider`.

## 📐 Architecture Notes

### Data Flow

```
User Action (UI)
  ↓
Server Action (app/actions/*.ts)
  ↓
Prisma Query (lib/prisma.ts)
  ↓
PostgreSQL Database
```

### Market Data Flow

```
UI Component
  ↓
Server Action (app/actions/stocks.ts)
  ↓
Provider Factory (lib/providers/factory.ts)
  ↓
IMarketDataProvider Implementation
  ↓
External API (Alpha Vantage, etc.)
```

### Authentication Flow

```
Login Page
  ↓
NextAuth signIn()
  ↓
Credentials Provider (lib/auth.ts)
  ↓
Prisma User Lookup
  ↓
JWT Token Created
  ↓
Session Cookie Set
  ↓
Protected Routes Accessible
```

## 🎨 Design Guidelines

### Colors

- **Success/Positive**: `#10B981` (green)
- **Error/Negative**: `#EF4444` (red)
- **Primary**: `#3B82F6` (blue)
- **Muted**: `#6B7280` (gray)

### Typography

Use system fonts for Apple aesthetic:
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Spacing

Follow 4px/8px grid system (Tailwind default)

### Shadows

Subtle shadows for depth:
```
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1)
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Sign up new user
- [ ] Login with credentials
- [ ] Search for stocks (AAPL, TSLA, etc.)
- [ ] Add stock to watchlist
- [ ] Create tags
- [ ] Assign tags to stocks
- [ ] Filter by tags (multi-select OR)
- [ ] Add notes to stock
- [ ] Edit/delete notes
- [ ] Archive stock (notes preserved)
- [ ] Unarchive stock
- [ ] Delete stock with notes (warning shown)
- [ ] Delete stock without notes (no warning)
- [ ] View archived stocks
- [ ] Sign out

### Unit Tests (Future)

Add Vitest or Jest for:
- Server action validation
- Provider interface compliance
- Utility functions

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Database Hosting

- **Neon** (recommended): https://neon.tech
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app

### Environment Variables in Production

Set all variables from `.env.example` in your hosting platform.

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Alpha Vantage API](https://www.alphavantage.co/documentation/)

## 🐛 Troubleshooting

### "Prisma Client not generated"
```bash
npx prisma generate
```

### "Database connection failed"
- Check DATABASE_URL in `.env`
- Ensure PostgreSQL is running
- Test connection with `npx prisma db push`

### "NextAuth signIn error"
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Ensure user exists in database

### "Market data not loading"
- Check MARKET_DATA_PROVIDER is set to "mock" for testing
- For Alpha Vantage, verify API key is valid
- Check network tab for API errors

## 🎯 Next Milestones

1. **Week 1**: Complete UI components + global search
2. **Week 2**: Stock detail view + charts + tag filtering
3. **Week 3**: Notes system + delete/archive flows
4. **Week 4**: Real-time quotes + animations + polish
5. **Week 5**: Testing + deployment + documentation

## 📞 Support

For issues or questions:
1. Check this guide
2. Review the PRD in the main README
3. Check implementation status in IMPLEMENTATION_STATUS.md
4. Review code comments for architecture notes

---

**Happy coding! 🚀**
