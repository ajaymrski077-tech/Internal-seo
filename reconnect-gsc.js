const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.integrationConnection.updateMany({
    where: { propertyId: 1, provider: "GSC" },
    data: {
      status: "CONNECTED",
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      tokenExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
    }
  });
  console.log("Updated GSC connection for property 1");
}
main().finally(() => prisma.$disconnect());
