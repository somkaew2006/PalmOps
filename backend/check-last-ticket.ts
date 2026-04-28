import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lastTicket = await prisma.weighTicket.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { farmer: true }
  });
  console.log('--- LAST TICKET ---');
  console.log(JSON.stringify(lastTicket, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
