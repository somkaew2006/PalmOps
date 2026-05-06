import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. หาบริษัทล้านนา
  const company = await prisma.company.findUnique({
    where: { subdomain: 'lanna' }
  });

  if (!company) {
    console.error('Company "lanna" not found. Please run npm run seed first.');
    return;
  }

  const companyId = company.id;
  console.log(`--- Seeding Products for Company: ${company.name} ---`);

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
      where: { 
        companyId_name: {
          companyId,
          name: groupData.name
        }
      },
      update: {},
      create: { 
        companyId,
        name: groupData.name 
      }
    });

    for (const prodName of groupData.products) {
      await prisma.product.upsert({
        where: { 
          companyId_name_groupId: { 
            companyId,
            name: prodName, 
            groupId: group.id 
          } 
        },
        update: {},
        create: { 
          companyId,
          name: prodName, 
          groupId: group.id 
        }
      });
    }
  }
  
  console.log('Seed products completed for company lanna.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
