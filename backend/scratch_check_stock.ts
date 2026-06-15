import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const branchId = 3;
  const stocks = await prisma.stock.findMany({
    where: { branchId },
    include: { branch: true }
  });
  
  console.log('--- Stocks for Branch 3 ---');
  console.log(JSON.stringify(stocks, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
