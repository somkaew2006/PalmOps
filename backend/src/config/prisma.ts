import { PrismaClient } from '@prisma/client';

// 1. สร้าง Base Prisma Client
const basePrisma = new PrismaClient();

/**
 * ฟังก์ชันช่วยแตก (Flatten) Unique Filter ให้กลายเป็น Filter ปกติสำหรับ findFirst
 * ใช้เฉพาะเมื่อเราเปลี่ยนจาก findUnique เป็น findFirst เท่านั้น
 */
function flattenUniqueFilter(where: any) {
  if (!where) return where;
  
  const newWhere = { ...where };
  
  for (const key of Object.keys(newWhere)) {
    const value = newWhere[key];
    
    // ถ้าเจอ Object ซ้อน (เช่น companyId_priceDate_branchId: { ... })
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // ดึงเอาฟิลด์ข้างในออกมาไว้ที่ระดับบนสุด
      Object.assign(newWhere, value);
      delete newWhere[key];
    }
  }
  
  return newWhere;
}

/**
 * ฟังก์ชันสร้าง Prisma Client ที่จะใส่ filter companyId ให้ทุก Query โดยอัตโนมัติ
 */
export const getTenantPrisma = (companyId: number) => {
  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const a = args as any;

          // --- 1. จัดการคำสั่งอ่านข้อมูล (Read) ---
          const readOps = ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'];
          
          if (readOps.includes(operation)) {
            // ใส่ companyId filter เสมอ
            a.where = { ...a.where, companyId };
            
            // พิเศษ: เปลี่ยน findUnique เป็น findFirst
            if (operation === 'findUnique') {
              // สำหรับ findFirst เราต้อง flatten เพราะมันไม่รู้จัก unique shorthand
              a.where = flattenUniqueFilter(a.where);
              return (basePrisma as any)[model].findFirst(a);
            }
          }

          // --- 2. จัดการคำสั่งสร้างข้อมูล (Create) ---
          if (operation === 'create') {
            a.data = { ...a.data, companyId };
          }
          
          if (operation === 'createMany') {
            if (Array.isArray(a.data)) {
              a.data = a.data.map((item: any) => ({ ...item, companyId }));
            }
          }

          // --- 3. จัดการคำสั่งแก้ไขและลบ (Update/Delete/Upsert) ---
          // สำหรับคำสั่งเหล่านี้ เราจะไม่ทำ flatten เพราะ Prisma บังคับให้ใช้ Unique Shorthand
          // แต่เราจะใส่ companyId เข้าไปใน filter ด้วยเพื่อความปลอดภัย
          if (['update', 'delete', 'upsert', 'updateMany', 'deleteMany'].includes(operation)) {
            // สำหรับ update/delete/upsert ทั่วไป Prisma มักไม่ยอมให้ใส่ filter นอกเหนือจาก Unique
            // ดังนั้นเราจะปล่อยให้ตัว Controller เป็นคนส่ง Unique Index ที่รวม companyId มาให้เอง
            // แต่สำหรับ *Many เราสามารถใส่ filter เพิ่มได้
            if (operation.endsWith('Many')) {
              a.where = { ...a.where, companyId };
            }
          }

          return query(args);
        },
      },
    },
  });
};

export default basePrisma;
