import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const hashedPassword = await bcrypt.hash("demo123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash: hashedPassword,
    },
  });

  console.log("✓ Created demo user:", user.email);

  // Create sample stocks
  const stocks = await Promise.all([
    prisma.stock.upsert({
      where: { symbol_exchange: { symbol: "AAPL", exchange: "NASDAQ" } },
      update: {},
      create: {
        symbol: "AAPL",
        exchange: "NASDAQ",
        name: "Apple Inc.",
        currency: "USD",
        country: "US",
        type: "stock",
      },
    }),
    prisma.stock.upsert({
      where: { symbol_exchange: { symbol: "TSLA", exchange: "NASDAQ" } },
      update: {},
      create: {
        symbol: "TSLA",
        exchange: "NASDAQ",
        name: "Tesla, Inc.",
        currency: "USD",
        country: "US",
        type: "stock",
      },
    }),
    prisma.stock.upsert({
      where: { symbol_exchange: { symbol: "TSM", exchange: "NYSE" } },
      update: {},
      create: {
        symbol: "TSM",
        exchange: "NYSE",
        name: "Taiwan Semiconductor",
        currency: "USD",
        country: "TW",
        type: "stock",
      },
    }),
  ]);

  console.log("✓ Created sample stocks:", stocks.length);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: "Tech" } },
      update: {},
      create: {
        userId: user.id,
        name: "Tech",
        color: "#3B82F6", // blue
      },
    }),
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: "Growth" } },
      update: {},
      create: {
        userId: user.id,
        name: "Growth",
        color: "#10B981", // green
      },
    }),
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: "Watchlist" } },
      update: {},
      create: {
        userId: user.id,
        name: "Watchlist",
        color: "#F59E0B", // amber
      },
    }),
  ]);

  console.log("✓ Created tags:", tags.length);

  // Add stocks to user's watchlist
  const userStocks = await Promise.all(
    stocks.map((stock, index) =>
      prisma.userStock.upsert({
        where: { userId_stockId: { userId: user.id, stockId: stock.id } },
        update: {},
        create: {
          userId: user.id,
          stockId: stock.id,
          order: index,
        },
      })
    )
  );

  console.log("✓ Added stocks to watchlist:", userStocks.length);

  // Add tags to stocks
  await prisma.userStockTag.createMany({
    data: [
      { userStockId: userStocks[0].id, tagId: tags[0].id }, // AAPL - Tech
      { userStockId: userStocks[0].id, tagId: tags[1].id }, // AAPL - Growth
      { userStockId: userStocks[1].id, tagId: tags[0].id }, // TSLA - Tech
      { userStockId: userStocks[2].id, tagId: tags[0].id }, // TSM - Tech
      { userStockId: userStocks[2].id, tagId: tags[2].id }, // TSM - Watchlist
    ],
    skipDuplicates: true,
  });

  console.log("✓ Tagged stocks");

  // Add sample notes
  await prisma.note.createMany({
    data: [
      {
        userStockId: userStocks[0].id,
        content:
          "Strong Q4 earnings. iPhone sales exceeded expectations. Considering buying more shares.",
        createdAt: new Date("2024-01-15"),
      },
      {
        userStockId: userStocks[0].id,
        content: "Announced new Vision Pro headset. Interesting diversification play.",
        createdAt: new Date("2024-02-01"),
      },
      {
        userStockId: userStocks[1].id,
        content: "Cybertruck deliveries ramping up. Stock volatile but fundamentals improving.",
        createdAt: new Date("2024-01-20"),
      },
    ],
  });

  console.log("✓ Created sample notes");

  console.log("\n✨ Seeding complete!");
  console.log("\n📧 Demo credentials:");
  console.log("   Email: demo@example.com");
  console.log("   Password: demo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
