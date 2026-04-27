import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log('Dashboard Stats Filter - Today:', today.toISOString());

    // Fetch all tickets for today to calculate stats manually (more robust for generated columns)
    const [ticketsToday, todayPrice, latestTickets] = await Promise.all([
      prisma.weighTicket.findMany({
        where: { weighInAt: { gte: today } }
      }),
      prisma.dailyPrice.findFirst({
        orderBy: { priceDate: 'desc' }
      }),
      prisma.weighTicket.findMany({
        take: 5,
        include: {
          farmer: true,
          vehicle: true
        },
        orderBy: { weighInAt: 'desc' }
      })
    ]);

    console.log('Tickets found for today:', ticketsToday.length);

    const ticketCount = ticketsToday.length;
    const totalWeight = ticketsToday.reduce((sum, t) => sum + parseFloat(t.finalWeightKg?.toString() || '0'), 0);
    const todayAmount = ticketsToday.reduce((sum, t) => sum + parseFloat(t.totalAmount?.toString() || '0'), 0);

    console.log(`Stats calculation: Count=${ticketCount}, Weight=${totalWeight}, Amount=${todayAmount}`);

    res.json({
      ticketCount,
      totalWeight,
      todayAmount,
      todayPrice: Number(todayPrice?.priceGradeA || 0),
      latestTickets
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
