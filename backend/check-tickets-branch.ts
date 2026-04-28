import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.weighTicket.findMany({
    include: { branch: true }
  });
  console.log('--- TICKETS IN DB ---');
  console.log(JSON.stringify(tickets, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
