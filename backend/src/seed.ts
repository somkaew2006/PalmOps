import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Initial Multi-tenant Data ---');

  // 1. Create a Default Company (Tenant)
  const company = await prisma.company.upsert({
    where: { subdomain: 'lanna' },
    update: {},
    create: {
      name: 'ลานปาล์มล้านนา',
      subdomain: 'lanna',
      isActive: true,
    },
  });
  console.log('Created Company:', company.name);

  // 2. Create a default branch for this company
  const branch = await prisma.branch.upsert({
    where: { 
      companyId_branchCode: {
        companyId: company.id,
        branchCode: 'MAIN'
      }
    },
    update: {},
    create: {
      companyId: company.id,
      branchCode: 'MAIN',
      branchName: 'สำนักงานใหญ่ (ล้านนา)',
      isActive: true,
    },
  });
  console.log('Created Branch:', branch.branchName);

  // 3. Create admin user for this company
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { 
      companyId_username: {
        companyId: company.id,
        username: 'admin'
      }
    },
    update: {
      passwordHash: hashedPassword,
      isActive: true,
      branchId: branch.id,
    },
    create: {
      companyId: company.id,
      username: 'admin',
      fullName: 'แอดมิน ล้านนา',
      passwordHash: hashedPassword,
      role: 'admin',
      isActive: true,
      branchId: branch.id,
    },
  });
  console.log('Created Admin User:', user.username);

  console.log('--- Seed Completed ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
