import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log('Today (Local 00:00):', today.toISOString());

  const stats = await Promise.all([
    prisma.weighTicket.count({
      where: { weighInAt: { gte: today } }
    }),
    prisma.weighTicket.aggregate({
      where: { weighInAt: { gte: today } },
      _sum: { finalWeightKg: true, totalAmount: true }
    })
  ]);

  console.log('Stats Result:', JSON.stringify(stats, null, 2));
  
  const allTickets = await prisma.weighTicket.findMany();
  console.log('All Tickets Dates:', allTickets.map(t => ({ id: t.id, weighInAt: t.weighInAt })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
