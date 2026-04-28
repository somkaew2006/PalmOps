import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://palm_admin:palm_pass@localhost:5435/palm_ops_db?schema=public'
    }
  }
});

async function main() {
  const groups = [
    { name: 'วัสดุสำนักงาน/เครื่องใช้', products: ['กระดาษ A4', 'ปากกา/เครื่องเขียน', 'หมึกพิมพ์', 'อุปกรณ์คอมพิวเตอร์'] },
    { name: 'สาธารณูปโภค', products: ['ค่าน้ำประปา', 'ค่าไฟฟ้า', 'ค่าอินเทอร์เน็ต', 'ค่าโทรศัพท์'] },
    { name: 'น้ำมันเชื้อเพลิง/หล่อลื่น', products: ['น้ำมันดีเซล (รถตัก)', 'น้ำมันไฮดรอลิก', 'จาระบี', 'น้ำมันเครื่อง'] },
    { name: 'อะไหล่/ซ่อมบำรุง', products: ['ค่าซ่อมรถตัก', 'ค่าซ่อมเครื่องจักร', 'ยางรถยนต์/เปลี่ยนยาง', 'อะไหล่เครื่องยนต์'] },
    { name: 'สินค้าปาล์ม', products: ['ปาล์มร่วง', 'ปาล์มลูกค้ารวม', 'ปาล์มเกรดเอ (พิเศษ)', 'ทลายปาล์ม'] },
    { name: 'ค่าแรง/จ้างเหมา', products: ['ค่าแทงปาล์ม (ต้น)', 'ค่าแทงโรงไม้สับ', 'ค่าแบกปาล์ม/ขึ้นรถ', 'ค่าแรงรายวัน', 'ค่าเหมาตัดหญ้าลาน'] },
    { name: 'ค่าใช้จ่ายบริหาร/จิปาถะ', products: ['ค่าธรรมเนียมธนาคาร', 'ค่าไปรษณีย์/ส่งเอกสาร', 'ค่ารับรองลูกค้า', 'วัสดุสิ้นเปลืองลาน'] }
  ];

  for (const groupData of groups) {
    const group = await prisma.productGroup.upsert({
      where: { name: groupData.name },
      update: {},
      create: { name: groupData.name }
    });

    for (const prodName of groupData.products) {
      await prisma.product.upsert({
        where: { name_groupId: { name: prodName, groupId: group.id } },
        update: {},
        create: { name: prodName, groupId: group.id }
      });
    }
  }
  
  // Create Admin User
  const hash = await bcrypt.hash('password123', 10);
  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        branchCode: 'HO',
        branchName: 'สำนักงานใหญ่',
        isActive: true
      }
    });
  }

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: hash, isActive: true },
    create: { 
      username: 'admin', 
      fullName: 'Administrator', 
      role: 'admin', 
      passwordHash: hash, 
      branchId: branch.id,
      isActive: true
    }
  });

  console.log('Seed data and Admin user completed.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
