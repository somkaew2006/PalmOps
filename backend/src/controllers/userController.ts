import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await req.db.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`[GetUsers] Company: ${req.companyId}, Found: ${users.length} users`);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, fullName, role, isActive } = req.body;

    const existingUser = await req.db.user.findUnique({
      where: {
        companyId_username: {
          companyId: req.companyId!,
          username
        }
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้ไปแล้วในบริษัทของคุณ' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await req.db.user.create({
      data: {
        username,
        passwordHash,
        fullName,
        role: role || 'weigher',
        isActive: isActive !== false
      }
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { fullName, role, isActive, password } = req.body;

    const targetUser = await req.db.user.findUnique({ where: { id: parseInt(id) } });
    if (!targetUser) return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });

    // ป้องกันการเปลี่ยนบทบาทของ Admin คนสุดท้าย
    if (targetUser.role === 'admin' && role && role !== 'admin') {
      const adminCount = await req.db.user.count({
        where: { role: 'admin' }
      });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'ไม่สามารถเปลี่ยนบทบาทได้ เนื่องจากต้องมี Admin อย่างน้อย 1 คน' });
      }
    }

    const data: any = {
      fullName,
      role,
      isActive
    };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await req.db.user.update({
      where: { id: parseInt(id) },
      data
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const currentUserId = (req as any).user?.id;
    
    // 1. ห้ามลบตัวเอง
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({ message: 'คุณไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้' });
    }

    // 2. ตรวจสอบข้อมูล User ที่จะลบ
    const targetUser = await req.db.user.findUnique({ where: { id: parseInt(id) } });
    if (!targetUser) return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });

    // 3. ถ้าเป็น Admin ต้องเช็คก่อนว่าไม่ใช่คนสุดท้าย
    if (targetUser.role === 'admin') {
      const adminCount = await req.db.user.count({
        where: { role: 'admin' }
      });
      
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'ไม่สามารถลบ Admin คนสุดท้ายของบริษัทได้' });
      }
    }

    await req.db.user.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'ลบผู้ใช้งานเรียบร้อยแล้ว' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
