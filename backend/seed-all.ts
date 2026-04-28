import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = 'password123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  // 1. Create Branches
  const b1 = await prisma.branch.create({
    data: {
      branchCode: 'BR001',
      branchName: 'สาขาหลัก (Main)',
      address: '123 Main Rd, Krabi',
      isActive: true
    }
  });

  const b2 = await prisma.branch.create({
    data: {
      branchCode: 'BR002',
      branchName: 'สาขาคลองท่อม',
      address: '456 Khlong Thom, Krabi',
      isActive: true
    }
  });

  // 2. Create Admin
  await prisma.user.create({
    data: {
      username: 'admin',
      fullName: 'System Admin',
      passwordHash: hash,
      role: 'admin',
      isActive: true,
      branchId: b1.id
    }
  });

  // 3. Create Farmers
  await prisma.farmer.create({
    data: {
      farmerCode: 'F001',
      fullName: 'นายสมชาย รักดี',
      phone: '0812345678',
      province: 'กระบี่',
      district: 'เมือง',
      subdistrict: 'ปากน้ำ',
      isActive: true
    }
  });

  console.log('Database seeded successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
