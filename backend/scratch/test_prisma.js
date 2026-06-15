
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const sales = await prisma.sale.findMany({
      where: {
        toBranchId: null
      },
      take: 1
    });
    console.log('Success!', sales);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
