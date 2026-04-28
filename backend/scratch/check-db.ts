import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const tables: any = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Tables in database:');
    tables.forEach((t: any) => console.log(`- ${t.table_name}`));
    
    const groups = await prisma.productGroup.findMany();
    console.log(`\nProduct Groups count: ${groups.length}`);
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
