import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = 'password123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { 
      passwordHash: hash,
      isActive: true 
    },
    create: {
      username: 'admin',
      fullName: 'System Admin',
      passwordHash: hash,
      role: 'admin',
      isActive: true
    }
  });

  console.log('Admin user password reset to: password123');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
