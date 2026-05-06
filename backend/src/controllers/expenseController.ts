import { Request, Response } from 'express';
// ลบการ import prisma แบบ global ออก


export const getExpenses = async (req: Request, res: Response) => {
  try {
    const { branchId, month, year } = req.query;
    const where: any = {};
    
    if (branchId) {
      where.branchId = parseInt(branchId as string);
    }
    
    if (month && year) {
      const m = parseInt(month as string);
      const y = parseInt(year as string);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      where.expenseDate = { gte: start, lte: end };
    }

    const expenses = await req.db.expense.findMany({
      where,
      include: { 
        branch: true,
        product: {
          include: { group: true }
        }
      },
      orderBy: { expenseDate: 'desc' }
    });
    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const { 
      expenseDate, description, quantity, 
      pricePerUnit, amount, note, branchId, productId 
    } = req.body;

    const expense = await req.db.expense.create({
      data: {
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        description,
        quantity: quantity ? parseFloat(quantity) : null,
        pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : null,
        amount: parseFloat(amount),
        note,
        branchId: parseInt(branchId),
        productId: productId ? parseInt(productId) : null,
        createdBy: (req as any).user?.id?.toString() || 'system'
      }
    });
    res.status(201).json(expense);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const idStr = req.params.id as string;
    const id = parseInt(idStr);
    console.log(`[DEBUG] Attempting to delete expense ID: ${id} for Company: ${req.companyId}`);
    
    await req.db.expense.delete({
      where: { 
        id,
        companyId: req.companyId!
      }
    });
    
    console.log(`[DEBUG] Successfully deleted expense ID: ${id}`);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    console.error('[ERROR] Delete expense failed:', error);
    res.status(500).json({ message: error.message });
  }
};
