import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const indexes = await prisma.$queryRaw`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'daily_prices';
  `;
  console.log('--- INDEXES ON daily_prices ---');
  console.log(JSON.stringify(indexes, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
