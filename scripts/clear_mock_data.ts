import prisma from '../src/lib/db';

async function main() {
  await prisma.analyticsSnapshot.deleteMany()
  await prisma.reportSnapshot.deleteMany()
  await prisma.report.deleteMany()
  
  // Update all connections to DISCONNECTED
  await prisma.integrationConnection.updateMany({
    data: {
      status: 'DISCONNECTED',
      syncStatus: null,
      syncError: null
    }
  })
  console.log('Cleared mock AnalyticsSnapshot data and reset connections.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
