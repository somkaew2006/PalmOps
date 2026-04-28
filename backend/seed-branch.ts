import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const branch = await prisma.branch.upsert({
    where: { branchCode: 'B001' },
    update: {},
    create: {
      branchCode: 'B001',
      branchName: 'สาขาสำนักงานใหญ่',
      address: '123 ถ.ปาล์มไทย ต.น้ำมัน อ.เมือง จ.กระบี่',
      phone: '081-234-5678',
      isActive: true,
      stocks: {
        create: [
          { grade: 'A', quantityKg: 0 },
          { grade: 'B', quantityKg: 0 },
          { grade: 'C', quantityKg: 0 }
        ]
      }
    }
  });

  console.log(`Default branch created: ${branch.branchName}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
