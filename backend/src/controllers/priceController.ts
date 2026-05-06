import { Request, Response } from 'express';
// ลบการ import prisma แบบ global ออก


export const getPrices = async (req: Request, res: Response) => {
  try {
    const prices = await req.db.dailyPrice.findMany({
      include: { branch: true },
      orderBy: { priceDate: 'desc' }
    });
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prices', error });
  }
};

export const getTodayPrice = async (req: Request, res: Response) => {
  try {
    const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const price = await req.db.dailyPrice.findFirst({
      where: {
        priceDate: { equals: today },
        branchId: branchId || undefined
      }
    });

    if (!price) {
      // Return the most recent price for this branch
      const latestPrice = await req.db.dailyPrice.findFirst({
        where: { branchId: branchId || undefined },
        orderBy: { priceDate: 'desc' }
      });
      
      return res.json(latestPrice || { 
        priceGradeA: 0, 
        priceGradeB: 0, 
        priceGradeC: 0, 
        ffaThresholdA: 5, 
        ffaThresholdB: 7 
      });
    }

    res.json(price);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching today price', error });
  }
};

export const createPrice = async (req: Request, res: Response) => {
  try {
    const { branchId, priceDate, priceGradeA, priceGradeB, priceGradeC, referenceSource, note } = req.body;
    
    if (!branchId) return res.status(400).json({ message: 'กรุณาระบุสาขา' });

    const date = new Date(priceDate);
    date.setHours(0, 0, 0, 0);

    console.log('[CreatePrice] Data:', { branchId, date, companyId: req.companyId });


    const existing = await req.db.dailyPrice.findUnique({
      where: { 
        companyId_priceDate_branchId: {
          companyId: req.companyId!,
          priceDate: date,
          branchId: parseInt(branchId)
        }
      }
    });


    if (existing) {
      return res.status(400).json({ message: 'ราคาวันนี้ของสาขานี้มีอยู่แล้ว กรุณาใช้การแก้ไขแทน' });
    }

    const price = await req.db.dailyPrice.create({
      data: {
        branchId: parseInt(branchId),
        priceDate: date,
        priceGradeA: parseFloat(priceGradeA),
        priceGradeB: parseFloat(priceGradeB),
        priceGradeC: parseFloat(priceGradeC),
        referenceSource: referenceSource || 'MPOB',
        note
      }
    });

    res.status(201).json(price);
  } catch (error: any) {
    console.error('[CreatePrice] Error:', error);
    res.status(500).json({ message: 'Error creating price', error: error.message });
  }

};

export const updatePrice = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { priceGradeA, priceGradeB, priceGradeC, referenceSource, note } = req.body;

    const price = await req.db.dailyPrice.update({
      where: { id: parseInt(id) },
      data: {
        priceGradeA: parseFloat(priceGradeA),
        priceGradeB: parseFloat(priceGradeB),
        priceGradeC: parseFloat(priceGradeC),
        referenceSource,
        note
      }
    });

    res.json(price);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating price', error: error.message });
  }
};

export const deletePrice = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await req.db.dailyPrice.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Price deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting price', error });
  }
};
