
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    console.log(`Checking data for period: ${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`);

    const tickets = await prisma.weighTicket.count({
      where: {
        weighInAt: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ['confirmed', 'paid'] }
      }
    });

    const sales = await prisma.sale.count({
      where: {
        saleDate: { gte: startOfMonth, lte: endOfMonth },
        status: 'completed'
      }
    });

    const expenses = await prisma.expense.count({
      where: {
        expenseDate: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    console.log('Results for this month:');
    console.log(`- Weigh Tickets: ${tickets}`);
    console.log(`- Sales: ${sales}`);
    console.log(`- Expenses: ${expenses}`);

    const totalTickets = await prisma.weighTicket.count();
    console.log(`Total Weigh Tickets in DB (all time): ${totalTickets}`);
    
    const firstTicket = await prisma.weighTicket.findFirst({
        orderBy: { weighInAt: 'desc' }
    });
    if (firstTicket) {
        console.log(`Latest ticket date: ${firstTicket.weighInAt}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
