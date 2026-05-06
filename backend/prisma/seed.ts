import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Multi-tenant data...');

  // 1. Create Default Company (Tenant)
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

  // 2. Create Default Branch for this company
  const branch = await prisma.branch.upsert({
    where: { 
      companyId_branchCode: {
        companyId: company.id,
        branchCode: 'HQ'
      }
    },
    update: {},
    create: {
      companyId: company.id,
      branchCode: 'HQ',
      branchName: 'สำนักงานใหญ่ (ล้านนา)',
      address: '123 ม.1 ต.คลองท่อม อ.คลองท่อม จ.กระบี่',
      phone: '075-123456',
      isActive: true
    }
  });
  console.log('Created Branch:', branch.branchName);

  // 3. Create Admin User for this company
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { 
      companyId_username: {
        companyId: company.id,
        username: 'admin'
      }
    },
    update: { passwordHash },
    create: {
      companyId: company.id,
      username: 'admin',
      fullName: 'แอดมิน ล้านนา',
      passwordHash,
      role: 'admin',
      isActive: true,
      branchId: branch.id
    }
  });
  console.log('Created Admin User: admin');

  // 4. Create Product Groups and Products for this company
  const groups = [
    { name: 'วัสดุสำนักงาน/เครื่องใช้', products: ['กระดาษ A4', 'ปากกา/หมึก', 'วัสดุสิ้นเปลือง'] },
    { name: 'สาธารณูปโภค', products: ['ค่าน้ำประปา', 'ค่าไฟฟ้า', 'ค่าอินเทอร์เน็ต/โทรศัพท์'] },
    { name: 'เชื้อเพลิงและน้ำมัน', products: ['น้ำมันดีเซล (รถตัก)', 'น้ำมันไฮดรอลิก', 'จาระบี'] },
    { name: 'ค่าซ่อมบำรุง', products: ['ซ่อมรถตัก/เครื่องจักร', 'ซ่อมบำรุงอาคาร', 'ค่าอะไหล่'] },
    { name: 'ค่าแรงและสวัสดิการ', products: ['ค่าแทงโรงไม้สับ', 'ค่าแรงเหมาตัก', 'ค่าแรงรายวัน'] },
    { name: 'สินค้า/บริการอื่นๆ', products: ['ปาล์มร่วง', 'ตะกอนปาล์ม', 'เบี้ยเลี้ยง'] }
  ];

  const createdProducts: any[] = [];
  for (const groupItem of groups) {
    const group = await prisma.productGroup.upsert({
      where: { 
        companyId_name: {
          companyId: company.id,
          name: groupItem.name
        }
      },
      update: {},
      create: {
        companyId: company.id,
        name: groupItem.name,
        note: `กลุ่มรายการสำหรับ ${groupItem.name}`
      }
    });

    for (const prodName of groupItem.products) {
      const prod = await prisma.product.upsert({
        where: { 
          companyId_name_groupId: { 
            companyId: company.id,
            name: prodName, 
            groupId: group.id 
          } 
        },
        update: {},
        create: {
          companyId: company.id,
          name: prodName,
          groupId: group.id,
          unit: 'รายการ'
        }
      });
      createdProducts.push(prod);
    }
  }
  console.log('Created Product Groups and Products');

  // 5. Create Sample Farmer for this company
  const farmer = await prisma.farmer.upsert({
    where: { 
      companyId_farmerCode: {
        companyId: company.id,
        farmerCode: 'F001'
      }
    },
    update: {},
    create: {
      companyId: company.id,
      farmerCode: 'F001',
      fullName: 'นายทดสอบ รักเกษตร',
      nationalId: '1234567890123',
      phone: '081-234-5678',
      isActive: true
    }
  });

  // 6. Create Sample Daily Price for this company
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const price = await prisma.dailyPrice.upsert({
    where: { 
      companyId_priceDate_branchId: { 
        companyId: company.id,
        priceDate: today, 
        branchId: branch.id 
      } 
    },
    update: {},
    create: {
      companyId: company.id,
      priceDate: today,
      branchId: branch.id,
      priceGradeA: 6.50,
      priceGradeB: 6.30,
      priceGradeC: 6.00,
      referenceSource: 'MPOB'
    }
  });

  // 7. Create Sample Weigh Ticket
  await prisma.weighTicket.create({
    data: {
      companyId: company.id,
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

  // 8. Create Sample Customer
  const customer = await prisma.customer.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: 'โรงงานสกัดน้ำมันปาล์ม AAA'
      }
    },
    update: {},
    create: {
      companyId: company.id,
      name: 'โรงงานสกัดน้ำมันปาล์ม AAA',
      isActive: true
    }
  });

  // 9. Create Sample Sale
  await prisma.sale.create({
    data: {
      companyId: company.id,
      saleNo: 'SL20260428-001',
      branchId: branch.id,
      customerId: customer.id,
      customerName: customer.name,
      grade: 'A',
      quantityKg: 20000,
      pricePerKg: 7.20,
      totalAmount: 144000,
      saleDate: new Date(),
      status: 'completed'
    }
  });

  // 10. Create Sample Expense
  await prisma.expense.create({
    data: {
      companyId: company.id,
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
