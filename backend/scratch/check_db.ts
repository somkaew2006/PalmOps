import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const branches = await prisma.branch.findMany({ select: { id: true, branchName: true } });
  console.log('--- BRANCHES ---');
  console.log(JSON.stringify(branches, null, 2));
  
  const tickets = await prisma.weighTicket.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { farmer: true }
  });
  console.log('--- LATEST TICKETS ---');
  console.log(JSON.stringify(tickets, null, 2));

  const expenses = await prisma.expense.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('--- LATEST EXPENSES ---');
  console.log(JSON.stringify(expenses, null, 2));
}
main().finally(() => prisma.$disconnect());
