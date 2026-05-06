import { Request, Response } from 'express';
// ลบการ import prisma แบบ global ออก


export const getReportData = async (req: Request, res: Response) => {
  try {
    const { month, year, branchId } = req.query;
    console.log(`[ReportController] Request received - Month: ${month}, Year: ${year}, Branch: ${branchId}`);
    const now = new Date();
    const targetMonth = month ? parseInt(month as string) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year as string) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const whereClause: any = {
      weighInAt: { gte: startDate, lte: endDate },
      status: { in: ['confirmed', 'paid'] }
    };
    if (branchId && branchId !== 'all' && branchId !== '') {
      whereClause.branchId = parseInt(branchId as string);
    }

    const expenseWhereClause: any = {
      expenseDate: { gte: startDate, lte: endDate }
    };
    if (branchId && branchId !== 'all' && branchId !== '') {
      expenseWhereClause.branchId = parseInt(branchId as string);
    }
    
    const saleWhereClause: any = {
      saleDate: { gte: startDate, lte: endDate },
      status: 'completed',
      toBranchId: null 
    };
    if (branchId && branchId !== 'all' && branchId !== '') {
      saleWhereClause.branchId = parseInt(branchId as string);
    }

    // Transfers query
    const transferWhereClause: any = {
      saleDate: { gte: startDate, lte: endDate },
      status: 'completed',
      toBranchId: { not: null }
    };
    if (branchId && branchId !== 'all' && branchId !== '') {
      transferWhereClause.branchId = parseInt(branchId as string);
    }

    // 1. Monthly Summary
    const [tickets, farmersCount, sales, transfers, expenses] = await Promise.all([
      req.db.weighTicket.findMany({ where: whereClause }),
      req.db.farmer.count(),
      req.db.sale.findMany({ where: saleWhereClause }),
      req.db.sale.findMany({ where: transferWhereClause }),
      req.db.expense.findMany({ where: expenseWhereClause })
    ]);

    const totalVolume = tickets.reduce((sum, t) => sum + Number(t.finalWeightKg || 0), 0);
    const totalAmount = tickets.reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
    const ticketCount = tickets.length;

    const totalSaleVolume = sales.reduce((sum, s) => sum + Number(s.quantityKg || 0), 0);
    const totalSaleAmount = sales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
    const totalTransferVolume = transfers.reduce((sum, s) => sum + Number(s.quantityKg || 0), 0);

    const totalOtherExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 2. Daily Volume (for the requested month)
    const dailyVolume: { [key: string]: number } = {};
    tickets.forEach(t => {
      const dateKey = new Date(t.weighInAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      dailyVolume[dateKey] = (dailyVolume[dateKey] || 0) + Number(t.finalWeightKg || 0);
    });

    const dailySaleVolume: { [key: string]: number } = {};
    sales.forEach(s => {
      const dateKey = new Date(s.saleDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      dailySaleVolume[dateKey] = (dailySaleVolume[dateKey] || 0) + Number(s.quantityKg || 0);
    });

    const dailyVolumeChart = Object.entries(dailyVolume).map(([date, volume]) => ({
      date,
      volume: volume / 1000 // Convert to tons
    })).sort((a, b) => a.date.localeCompare(b.date));

    const dailySaleVolumeChart = Object.entries(dailySaleVolume).map(([date, volume]) => ({
      date,
      volume: volume / 1000 // Convert to tons
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 3. Grade Distribution
    const grades: { [key: string]: number } = { 'A': 0, 'B': 0, 'C': 0 };
    tickets.forEach(t => {
      if (t.grade && grades[t.grade as string] !== undefined) {
        grades[t.grade as string]++;
      }
    });

    const totalForGrades = tickets.length || 1;
    const gradeDistribution = {
      A: Math.round((grades['A'] / totalForGrades) * 100),
      B: Math.round((grades['B'] / totalForGrades) * 100),
      C: Math.round((grades['C'] / totalForGrades) * 100)
    };

    res.json({
      summary: {
        totalVolume,
        totalAmount,
        ticketCount,
        farmersCount,
        totalSaleVolume,
        totalSaleAmount,
        totalTransferVolume,
        totalOtherExpenseAmount,
        netProfit: totalSaleAmount - totalAmount - totalOtherExpenseAmount
      },
      dailyVolume: dailyVolumeChart.slice(-7),
      dailySaleVolume: dailySaleVolumeChart.slice(-7),
      gradeDistribution,
      transactions: {
        tickets: await req.db.weighTicket.findMany({
          where: whereClause,
          include: { 
            farmer: { select: { fullName: true } },
            branch: { select: { branchName: true } }
          },
          orderBy: { weighInAt: 'desc' }
        }),
        sales: await req.db.sale.findMany({
          where: saleWhereClause,
          include: { 
            branch: { select: { branchName: true } },
            customer: { select: { name: true } }
          },
          orderBy: { saleDate: 'desc' }
        }),
        transfers: await req.db.sale.findMany({
          where: transferWhereClause,
          include: { 
            branch: { select: { branchName: true } },
            toBranch: { select: { branchName: true } }
          },
          orderBy: { saleDate: 'desc' }
        }),
        expenses: await req.db.expense.findMany({
          where: expenseWhereClause,
          include: {
            branch: { select: { branchName: true } },
            product: { include: { group: true } }
          },
          orderBy: { expenseDate: 'desc' }
        })
      }
    });
  } catch (error: any) {
    console.error('Report Data Error:', error);
    res.status(500).json({ message: error.message });
  }
};
