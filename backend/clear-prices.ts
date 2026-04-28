import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.dailyPrice.deleteMany();
  console.log('Cleared all daily prices.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
