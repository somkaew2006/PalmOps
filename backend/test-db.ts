import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const farmer = await prisma.farmer.findUnique({
    where: { id: 1 },
    include: { farmPlots: true }
  });
  console.log('Farmer 1:', JSON.stringify(farmer, null, 2));
  
  const count = await prisma.farmer.count();
  console.log('Total Farmers:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
