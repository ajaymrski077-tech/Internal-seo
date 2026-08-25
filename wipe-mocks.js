const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const mockClients = [
    'Acme Corp',
    'Zenith Retail',
    'Apex Global',
    'Novamira Tech',
    'Legacy Solutions',
    'test',
    'Globex',
    'Initech',
    'Umbrella Corp'
  ];

  console.log("Deleting mock clients...");
  
  const result = await prisma.client.deleteMany({
    where: {
      name: {
        in: mockClients
      }
    }
  });

  console.log(`Deleted ${result.count} mock clients and their cascaded records.`);

  const remaining = await prisma.client.findMany();
  console.log("Remaining real clients:", remaining.map(c => c.name));
}

main().finally(() => prisma.$disconnect());
