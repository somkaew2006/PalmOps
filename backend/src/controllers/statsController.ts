import { Request, Response } from 'express';
// ลบการ import prisma แบบ global ออก


export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const branchIdQuery = req.query.branchId as string;
    const branchId = branchIdQuery ? parseInt(branchIdQuery) : null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereClause: any = {
      weighInAt: { gte: today, lt: tomorrow },
      status: { in: ['confirmed', 'paid'] }
    };
    if (branchId) whereClause.branchId = branchId;

    const saleWhereClause: any = {
      saleDate: { gte: today, lt: tomorrow },
      status: 'completed'
    };
    if (branchId) saleWhereClause.branchId = branchId;

    const latestWhereClause: any = {};
    if (branchId) latestWhereClause.branchId = branchId;

    const [ticketsToday, salesToday, todayPrice, latestTickets] = await Promise.all([
      req.db.weighTicket.findMany({ where: whereClause }),
      req.db.sale.findMany({ where: saleWhereClause }),
      req.db.dailyPrice.findFirst({
        where: branchId ? { branchId } : undefined,
        orderBy: { priceDate: 'desc' }
      }),
      req.db.weighTicket.findMany({
        where: latestWhereClause,
        take: 8,
        include: {
          farmer: true,
          vehicle: true,
          branch: true
        },
        orderBy: { weighInAt: 'desc' }
      })
    ]);

    const ticketCount = ticketsToday.length;
    const totalWeight = ticketsToday.reduce((sum, t) => sum + parseFloat(t.finalWeightKg?.toString() || '0'), 0);
    const todayAmount = ticketsToday.reduce((sum, t) => sum + parseFloat(t.totalAmount?.toString() || '0'), 0);

    const saleCount = salesToday.length;
    const saleWeight = salesToday.reduce((sum, s) => sum + parseFloat(s.quantityKg.toString()), 0);
    const saleAmount = salesToday.reduce((sum, s) => sum + parseFloat(s.totalAmount?.toString() || '0'), 0);

    res.json({
      ticketCount,
      totalWeight,
      todayAmount,
      saleCount,
      saleWeight,
      saleAmount,
      todayPrice: Number(todayPrice?.priceGradeA || 0),
      latestTickets
    });
  } catch (error: any) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: error.message });
  }
};
