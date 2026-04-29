import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const branchIdStr = req.query.branchId as string;
    const where: any = {};
    
    if (branchIdStr) where.branchId = parseInt(branchIdStr);
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate as string);
      if (endDate) where.expenseDate.lte = new Date(endDate as string);
    }

    const expenses = await prisma.expense.findMany({
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

    const expense = await prisma.expense.create({
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
    await prisma.expense.delete({
      where: { id: parseInt(idStr) }
    });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
