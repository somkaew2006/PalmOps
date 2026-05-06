import { Request, Response } from 'express';
// ลบการ import prisma แบบ global ออก


export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await req.db.customer.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, phone, address, note } = req.body;
    const customer = await req.db.customer.create({
      data: { name, phone, address, note }
    });
    res.status(201).json(customer);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, phone, address, note, isActive } = req.body;
    const customer = await req.db.customer.update({
      where: { id: parseInt(id) },
      data: { name, phone, address, note, isActive }
    });
    res.json(customer);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // Check if customer has sales
    const customerWithSales = await req.db.customer.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { sales: true } } }
    });

    if (customerWithSales?._count.sales && customerWithSales._count.sales > 0) {
      return res.status(400).json({ message: 'ไม่สามารถลบได้เนื่องจากมีการใช้งานในรายการขายแล้ว' });
    }

    await req.db.customer.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'ลบข้อมูลลูกค้าสำเร็จ' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
