import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Initial Data ---');

  // 1. Create a default branch
  const branch = await prisma.branch.upsert({
    where: { branchCode: 'MAIN' },
    update: {},
    create: {
      branchCode: 'MAIN',
      branchName: 'สำนักงานใหญ่',
      isActive: true,
    },
  });
  console.log('Created/Verified Branch:', branch.branchName);

  // 2. Create admin user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: hashedPassword,
      isActive: true,
      branchId: branch.id,
    },
    create: {
      username: 'admin',
      fullName: 'System Administrator',
      passwordHash: hashedPassword,
      role: 'admin',
      isActive: true,
      branchId: branch.id,
    },
  });
  console.log('Created/Verified Admin User:', user.username);

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
