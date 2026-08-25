const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.length);
  
  if (users.length === 0) {
    console.log("Creating default user...");
    await prisma.user.create({
      data: {
        email: "admin@mistersk.com",
        name: "Admin User",
        password: "password123"
      }
    });
    console.log("User created.");
  }
}
main().finally(() => prisma.$disconnect());
