import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const plainPassword = 'changeme';
  
  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
  
  // Update the user
  const updatedUser = await prisma.user.update({
    where: { username },
    data: { passwordHash: hashedPassword },
  });
  
  console.log(`Password for user '${updatedUser.username}' has been updated to '${plainPassword}'`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
