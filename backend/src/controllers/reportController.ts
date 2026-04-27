import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getReportData = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month as string) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year as string) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // 1. Monthly Summary
    const [tickets, farmersCount] = await Promise.all([
      prisma.weighTicket.findMany({
        where: { weighInAt: { gte: startDate, lte: endDate } }
      }),
      prisma.farmer.count()
    ]);

    const totalVolume = tickets.reduce((sum, t) => sum + parseFloat(t.finalWeightKg?.toString() || '0'), 0);
    const totalAmount = tickets.reduce((sum, t) => sum + parseFloat(t.totalAmount?.toString() || '0'), 0);
    const ticketCount = tickets.length;

    // 2. Daily Volume (for the requested month)
    const dailyVolume: { [key: string]: number } = {};
    tickets.forEach(t => {
      const dateKey = new Date(t.weighInAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      dailyVolume[dateKey] = (dailyVolume[dateKey] || 0) + parseFloat(t.finalWeightKg?.toString() || '0');
    });

    const dailyVolumeChart = Object.entries(dailyVolume).map(([date, volume]) => ({
      date,
      volume: volume / 1000 // Convert to tons
    })).sort((a, b) => {
        // Simplified sort for display
        return 1; 
    });

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
        totalVolume: totalVolume / 1000, // tons
        totalAmount: totalAmount / 1000000, // millions
        ticketCount,
        farmersCount
      },
      dailyVolume: dailyVolumeChart.slice(-7), // Last 7 days of activity in that month
      gradeDistribution
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
