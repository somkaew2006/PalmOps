import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`DROP INDEX IF EXISTS daily_prices_price_date_key;`;
  console.log('Dropped daily_prices_price_date_key index.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
