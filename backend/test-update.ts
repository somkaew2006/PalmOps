import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- TESTING UPDATE FARMER LOGIC VIA SCRIPT ---');
  const id = 1;
  const updateData: any = {
    fullName: "Test Script Update",
    farmPlots: {
      deleteMany: {},
      create: [
        {
          plotCode: "P-SCRIPT-" + Date.now(),
          areaRai: 10,
        }
      ]
    }
  };

  try {
    const res = await prisma.farmer.update({
      where: { id },
      data: updateData,
      include: { farmPlots: true }
    });
    console.log('Success:', JSON.stringify(res, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Full Error:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
