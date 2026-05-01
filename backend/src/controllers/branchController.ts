import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getBranches = async (req: Request, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        stocks: true,
        _count: {
          select: { weighTickets: true, users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(branches);
  } catch (error: any) {
    console.error('Get Branches Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getBranch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const branch = await prisma.branch.findUnique({
      where: { id: parseInt(id) },
      include: { stocks: true }
    });
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json(branch);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const { branchCode, branchName, address, phone, isActive } = req.body;
    
    // Create branch and initialize stock for grades A, B, C
    const branch = await prisma.branch.create({
      data: {
        branchCode,
        branchName,
        address,
        phone,
        isActive: isActive !== false,
        stocks: {
          create: [
            { grade: 'A', quantityKg: 0 },
            { grade: 'B', quantityKg: 0 },
            { grade: 'C', quantityKg: 0 }
          ]
        }
      },
      include: { stocks: true }
    });
    res.status(201).json(branch);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { branchCode, branchName, address, phone, isActive } = req.body;
    
    console.log('--- UPDATING BRANCH ---');
    console.log('ID:', id);
    console.log('Body:', req.body);

    const branch = await prisma.branch.update({
      where: { id: parseInt(id) },
      data: {
        branchCode,
        branchName,
        address,
        phone,
        isActive: isActive !== false
      }
    });

    console.log('Updated Branch result:', branch);
    res.json(branch);
  } catch (error: any) {
    console.error('Update Branch error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.branch.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Branch deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStocks = async (req: Request, res: Response) => {
  try {
    const branchIdStr = req.query.branchId as string;
    const where = branchIdStr ? { branchId: parseInt(branchIdStr) } : {};
    const stocks = await prisma.stock.findMany({
      where,
      include: { branch: true }
    });
    res.json(stocks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const getBranchStockHistory = async (req: Request, res: Response) => {
  try {
    const branchIdParam = req.params.id as string;
    const isAll = branchIdParam === 'all';
    const branchId = isAll ? undefined : parseInt(branchIdParam);
    const gradeParam = req.query.grade as string;
    const monthParam = req.query.month as string; // 1-12
    const yearParam = req.query.year as string;   // 2024, 2025...
    console.log(`[StockHistory] Filtering by Branch: ${branchIdParam}, Grade: ${gradeParam}, Month: ${monthParam}, Year: ${yearParam}`);

    let dateFilter: any = {};
    if (yearParam) {
      const year = parseInt(yearParam);
      if (monthParam && parseInt(monthParam) > 0) {
        const month = parseInt(monthParam);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
        dateFilter = { lte: endOfMonth };
      } else {
        // All months for the selected year
        const endOfYear = new Date(year, 12, 0, 23, 59, 59, 999);
        dateFilter = { lte: endOfYear };
      }
    }
    
    // Fetch tickets (Include all except draft) up to the end of the selected period
    const tickets = await prisma.weighTicket.findMany({
      where: { 
        ...(branchId ? { branchId } : {}),
        ...(gradeParam ? { grade: gradeParam as any } : {}),
        status: { not: 'draft' },
        ...(yearParam ? { weighInAt: dateFilter } : {})
      },
      include: { branch: true },
      orderBy: { weighInAt: 'asc' }
    });

    // Fetch sales up to the end of the selected period
    const sales = await prisma.sale.findMany({
      where: { 
        ...(branchId ? { branchId } : {}),
        ...(gradeParam ? { grade: gradeParam as any } : {}),
        ...(yearParam ? { saleDate: dateFilter } : {})
      },
      include: { branch: true },
      orderBy: { saleDate: 'asc' }
    });

    // Merge and sort ASC for calculation
    let runningBalance = 0;
    const history = [
      ...tickets.map(t => ({
        id: `t-${t.id}`,
        date: t.weighInAt,
        type: 'IN',
        reference: t.ticketNo,
        grade: t.grade,
        quantity: Number(t.finalWeightKg || t.netWeightKg || 0),
        status: t.status,
        branchName: t.branch.branchName,
        description: 'รับซื้อปาล์ม (Stock In)'
      })),
      ...sales.map(s => ({
        id: `s-${s.id}`,
        date: s.saleDate,
        type: 'OUT',
        reference: s.saleNo,
        grade: s.grade,
        quantity: Number(s.quantityKg),
        status: s.status,
        branchName: s.branch.branchName,
        description: 'ขายออก (Stock Out)'
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate balances
    const historyWithBalance = history.map(item => {
      const beginningBalance = runningBalance;
      if (item.status !== 'cancelled') {
        if (item.type === 'IN') {
          runningBalance += item.quantity;
        } else {
          runningBalance -= item.quantity;
        }
      }
      return {
        ...item,
        beginningBalance,
        endingBalance: runningBalance
      };
    });

    // Filter only the selected month if requested
    let result = historyWithBalance;
    if (yearParam) {
      const year = parseInt(yearParam);
      const monthVal = parseInt(monthParam || '0');
      
      console.log(`[FilterDebug] Target Year: ${year}, Target Month: ${monthVal}`);

      result = historyWithBalance.filter((item, index) => {
        const d = new Date(item.date);
        const itemYear = d.getFullYear();
        const itemMonth = d.getMonth() + 1; // 1-12
        
        const yearMatch = itemYear === year;
        const monthMatch = monthVal === 0 || itemMonth === monthVal;
        
        if (index < 5) {
          console.log(`[ItemDebug] Date: ${item.date}, ItemMonth: ${itemMonth}, MonthMatch: ${monthMatch}`);
        }
        
        return yearMatch && monthMatch;
      });
    }

    // Return reversed (latest first) for display
    res.json(result.reverse());
  } catch (error: any) {
    console.error('Get Stock History Error:', error);
    res.status(500).json({ message: error.message });
  }
};
