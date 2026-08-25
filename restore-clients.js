const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function restore() {
  console.log("Restoring accidentally deleted clients...");

  const clients = [
    { name: 'Roost' },
    { name: 'MisterSk' },
    { name: 'EIN Search' },
    { name: 'FIN Search' },
    { name: 'Datum' }
  ];

  for (const c of clients) {
    const created = await prisma.client.create({ data: { name: c.name, status: "ACTIVE" } });
    console.log("Restored client:", created.name, "with ID:", created.id);

    // Restore properties if applicable
    if (c.name === 'Roost') {
      await prisma.websiteProperty.create({
        data: {
          clientId: created.id,
          domain: 'roost-inky.vercel.app',
          name: 'Roost Website',
          brandType: 'Non-Branded',
          connections: {
            create: [
              { provider: 'GA4', status: 'DISCONNECTED' },
              { provider: 'GSC', status: 'DISCONNECTED' }
            ]
          }
        }
      });
    } else if (c.name === 'MisterSk') {
      await prisma.websiteProperty.create({
        data: {
          clientId: created.id,
          domain: 'misterskinfotech.com',
          name: 'MisterSk Website',
          brandType: 'Non-Branded',
          connections: {
            create: [
              { provider: 'GA4', status: 'DISCONNECTED' },
              { provider: 'GSC', status: 'DISCONNECTED' }
            ]
          }
        }
      });
    }
  }

  console.log("Restore complete.");
}

restore().catch(console.error).finally(() => prisma.$disconnect());
