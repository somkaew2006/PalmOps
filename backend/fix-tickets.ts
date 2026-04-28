import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.weighTicket.findMany();
  console.log(`Found ${tickets.length} tickets to check.`);

  for (const t of tickets) {
    const gross = t.grossWeightKg.toNumber();
    const tare = t.tareWeightKg.toNumber();
    const ded = t.deductionKg.toNumber();
    const price = t.pricePerKg.toNumber();
    
    const net = gross - tare;
    const final = net - ded;
    const total = final * price;

    await prisma.weighTicket.update({
      where: { id: t.id },
      data: {
        netWeightKg: net,
        finalWeightKg: final,
        totalAmount: total
      }
    });
    console.log(`Updated Ticket ${t.ticketNo}: Net=${net}, Final=${final}, Total=${total}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
