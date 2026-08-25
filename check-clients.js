const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const clients = await prisma.client.findMany();
  console.log(clients.map(c => c.name));
}
main().finally(() => prisma.$disconnect());
