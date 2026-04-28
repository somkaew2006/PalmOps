import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getReportData = async (req: Request, res: Response) => {
  try {
    const { month, year, branchId } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month as string) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year as string) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const whereClause: any = {
      weighInAt: { gte: startDate, lte: endDate },
      status: { in: ['confirmed', 'paid'] }
    };
    if (branchId) whereClause.branchId = parseInt(branchId as string);

    const saleWhereClause: any = {
      saleDate: { gte: startDate, lte: endDate },
      status: 'completed'
    };
    if (branchId) saleWhereClause.branchId = parseInt(branchId as string);

    // 1. Monthly Summary
    const [tickets, farmersCount, sales] = await Promise.all([
      prisma.weighTicket.findMany({
        where: whereClause
      }),
      prisma.farmer.count(),
      prisma.sale.findMany({
        where: saleWhereClause
      })
    ]);

    const totalVolume = tickets.reduce((sum, t) => sum + parseFloat(t.finalWeightKg?.toString() || '0'), 0);
    const totalAmount = tickets.reduce((sum, t) => sum + parseFloat(t.totalAmount?.toString() || '0'), 0);
    const ticketCount = tickets.length;

    const totalSaleVolume = sales.reduce((sum, s) => sum + parseFloat(s.quantityKg.toString()), 0);
    const totalSaleAmount = sales.reduce((sum, s) => sum + parseFloat(s.totalAmount?.toString() || '0'), 0);

    // 2. Daily Volume (for the requested month)
    const dailyVolume: { [key: string]: number } = {};
    tickets.forEach(t => {
      const dateKey = new Date(t.weighInAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      dailyVolume[dateKey] = (dailyVolume[dateKey] || 0) + parseFloat(t.finalWeightKg?.toString() || '0');
    });

    const dailySaleVolume: { [key: string]: number } = {};
    sales.forEach(s => {
      const dateKey = new Date(s.saleDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      dailySaleVolume[dateKey] = (dailySaleVolume[dateKey] || 0) + parseFloat(s.quantityKg.toString());
    });

    const dailyVolumeChart = Object.entries(dailyVolume).map(([date, volume]) => ({
      date,
      volume: volume / 1000 // Convert to tons
    })).sort((a, b) => 1);

    const dailySaleVolumeChart = Object.entries(dailySaleVolume).map(([date, volume]) => ({
      date,
      volume: volume / 1000 // Convert to tons
    })).sort((a, b) => 1);

    // 3. Grade Distribution
    const grades: { [key: string]: number } = { 'A': 0, 'B': 0, 'C': 0 };
    tickets.forEach(t => {
      if (t.grade && grades[t.grade] !== undefined) {
        grades[t.grade]++;
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
        totalVolume: totalVolume / 1000,
        totalAmount: totalAmount / 1000000,
        ticketCount,
        farmersCount,
        totalSaleVolume: totalSaleVolume / 1000,
        totalSaleAmount: totalSaleAmount / 1000000
      },
      dailyVolume: dailyVolumeChart.slice(-7),
      dailySaleVolume: dailySaleVolumeChart.slice(-7),
      gradeDistribution,
      transactions: {
        tickets: await prisma.weighTicket.findMany({
          where: whereClause,
          include: { 
            farmer: { select: { fullName: true } },
            branch: { select: { branchName: true } }
          },
          orderBy: { weighInAt: 'desc' }
        }),
        sales: await prisma.sale.findMany({
          where: saleWhereClause,
          include: {
            branch: { select: { branchName: true } }
          },
          orderBy: { saleDate: 'desc' }
        })
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
