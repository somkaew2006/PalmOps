import { Request, Response, NextFunction } from 'express';
import prisma, { getTenantPrisma } from '../config/prisma';

declare global {
  namespace Express {
    interface Request {
      companyId?: number;
      companyName?: string;
      db: any;
    }
  }
}

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hostname = req.hostname; // เช่น 'lanna.palmops.net' หรือ 'pt.palmops.net'
    
    // แยกเอาเฉพาะตัวแรกสุด (Subdomain)
    // lanna.palmops.net -> lanna
    // pt.palmops.net -> pt
    const subdomain = hostname.split('.')[0];

    // กรณีพิเศษ: ถ้าเข้าผ่าน IP ตรงๆ หรือ localhost โดยไม่มี subdomain
    if (!subdomain || subdomain === 'localhost' || subdomain === '127' || hostname.split('.').length < 2) {
      // ในระบบจริง คุณอาจต้องการให้ Redirect ไปที่หน้า Landing Page หลัก
      // แต่สำหรับการทดสอบ เราจะให้ใช้ฐานข้อมูลกลางหรือแสดง error
      const firstCompany = await prisma.company.findFirst();
      if (!firstCompany) {
        req.db = prisma;
        return next();
      }
      // ในโหมดพัฒนา ให้ใช้ตัวแรกเป็น default
      return proceedWithCompany(firstCompany, req, next);
    }

    // ค้นหาบริษัทจาก Subdomain
    const company = await prisma.company.findUnique({
      where: { subdomain }
    });

    // --- ส่วนสำคัญ: ถ้าไม่มีบริษัทนี้ในตาราง จะเข้าไม่ได้ ---
    if (!company) {
      return res.status(404).json({ 
        message: `ไม่พบบริษัทภายใต้โดเมน ${hostname} กรุณาตรวจสอบ URL อีกครั้ง` 
      });
    }

    // เช็คว่าบริษัทยังใช้งานได้อยู่หรือไม่
    if (!company.isActive) {
      return res.status(403).json({ 
        message: `ขออภัย บริษัท ${company.name} ถูกระงับการใช้งานชั่วคราว` 
      });
    }

    return proceedWithCompany(company, req, next);

  } catch (error) {
    console.error('[TenantMiddleware] Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลบริษัท' });
  }
};

// Helper function เพื่อเซ็ตค่า Prisma Client
function proceedWithCompany(company: any, req: Request, next: NextFunction) {
  req.companyId = company.id;
  req.companyName = company.name;
  
  // สร้าง Prisma Client ที่จะกรองข้อมูล (WHERE company_id = ?) ให้อัตโนมัติทุกคำสั่ง!
  req.db = getTenantPrisma(company.id);
  
  next();
}
