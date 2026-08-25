const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Wiping all application data (keeping Users)...");

  // Delete all records (SQLite foreign key constraints or Prisma cascades might require order, but deleteMany works)
  await prisma.analyticsSnapshot.deleteMany({});
  await prisma.reportSnapshot.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.deliveryEvent.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.integrationConnection.deleteMany({});
  await prisma.websiteProperty.deleteMany({});
  await prisma.client.deleteMany({});

  console.log("All mock/dummy application data cleared.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
