import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const plainPassword = 'password123';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

  const admin = await prisma.user.upsert({
    where: { username },
    update: { passwordHash: hashedPassword },
    create: {
      username,
      fullName: 'System Admin',
      passwordHash: hashedPassword,
      role: 'admin',
      isActive: true
    }
  });

  console.log(`Admin user created/updated: ${admin.username}`);
  console.log(`Password: ${plainPassword}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
