import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // 1. Create Default Branch
  const branch = await prisma.branch.upsert({
    where: { branchCode: 'HQ' },
    update: {},
    create: {
      branchCode: 'HQ',
      branchName: 'สำนักงานใหญ่ (HQ)',
      address: '123 ม.1 ต.คลองท่อม อ.คลองท่อม จ.กระบี่',
      phone: '075-123456',
      isActive: true
    }
  });

  // 2. Create Admin User
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash },
    create: {
      username: 'admin',
      fullName: 'Administrator',
      passwordHash,
      role: 'admin',
      isActive: true,
      branchId: branch.id
    }
  });

  // 3. Create Product Groups and Products
  const groups = [
    {
      name: 'วัสดุสำนักงาน/เครื่องใช้',
      products: ['กระดาษ A4', 'ปากกา/หมึก', 'วัสดุสิ้นเปลือง']
    },
    {
      name: 'สาธารณูปโภค',
      products: ['ค่าน้ำประปา', 'ค่าไฟฟ้า', 'ค่าอินเทอร์เน็ต/โทรศัพท์']
    },
    {
      name: 'เชื้อเพลิงและน้ำมัน',
      products: ['น้ำมันดีเซล (รถตัก)', 'น้ำมันไฮดรอลิก', 'จาระบี']
    },
    {
      name: 'ค่าซ่อมบำรุง',
      products: ['ซ่อมรถตัก/เครื่องจักร', 'ซ่อมบำรุงอาคาร', 'ค่าอะไหล่']
    },
    {
      name: 'ค่าแรงและสวัสดิการ',
      products: ['ค่าแทงโรงไม้สับ', 'ค่าแรงเหมาตัก', 'ค่าแรงรายวัน']
    },
    {
      name: 'สินค้า/บริการอื่นๆ',
      products: ['ปาล์มร่วง', 'ตะกอนปาล์ม', 'เบี้ยเลี้ยง']
    }
  ];

  const createdProducts: any[] = [];
  for (const groupItem of groups) {
    const group = await prisma.productGroup.upsert({
      where: { name: groupItem.name },
      update: {},
      create: {
        name: groupItem.name,
        note: `กลุ่มรายการสำหรับ ${groupItem.name}`
      }
    });

    for (const prodName of groupItem.products) {
      const prod = await prisma.product.upsert({
        where: { name_groupId: { name: prodName, groupId: group.id } },
        update: {},
        create: {
          name: prodName,
          groupId: group.id,
          unit: 'รายการ'
        }
      });
      createdProducts.push(prod);
    }
  }

  // 4. Create Sample Farmer
  const farmer = await prisma.farmer.upsert({
    where: { farmerCode: 'F001' },
    update: {},
    create: {
      farmerCode: 'F001',
      fullName: 'นายทดสอบ รักเกษตร',
      nationalId: '1234567890123',
      phone: '081-234-5678',
      isActive: true
    }
  });

  // 5. Create Sample Daily Price
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const price = await prisma.dailyPrice.upsert({
    where: { priceDate_branchId: { priceDate: today, branchId: branch.id } },
    update: {},
    create: {
      priceDate: today,
      branchId: branch.id,
      priceGradeA: 6.50,
      priceGradeB: 6.30,
      priceGradeC: 6.00,
      referenceSource: 'MPOB'
    }
  });

  // 6. Create Sample Weigh Ticket
  await prisma.weighTicket.create({
    data: {
      ticketNo: 'TK20260428-001',
      farmerId: farmer.id,
      branchId: branch.id,
      priceId: price.id,
      grade: 'A',
      grossWeightKg: 12500,
      tareWeightKg: 5000,
      netWeightKg: 7500,
      finalWeightKg: 7400,
      pricePerKg: 6.50,
      totalAmount: 48100,
      status: 'paid',
      weighInAt: new Date(),
    }
  });

  // 7. Create Sample Sale
  await prisma.sale.create({
    data: {
      saleNo: 'SL20260428-001',
      branchId: branch.id,
      customerName: 'โรงงานสกัดน้ำมันปาล์ม AAA',
      grade: 'A',
      quantityKg: 20000,
      pricePerKg: 7.20,
      totalAmount: 144000,
      saleDate: new Date(),
      status: 'completed'
    }
  });

  // 8. Create Sample Expense
  await prisma.expense.create({
    data: {
      description: 'ค่าน้ำมันดีเซลสำหรับรถตัก',
      amount: 2500,
      expenseDate: new Date(),
      branchId: branch.id,
      productId: createdProducts.find(p => p.name.includes('น้ำมันดีเซล'))?.id
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
