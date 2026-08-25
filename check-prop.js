const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const properties = await prisma.websiteProperty.findMany();
  console.log('Total properties:', properties.length);
  if (properties.length > 0) {
    console.log(properties.slice(0, 3));
  }
}
main().finally(() => prisma.$disconnect());
