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
    res.status(500).json({ message: error.message });
  }
};

export const getBranch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
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
    const id = req.params.id;
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
    const id = req.params.id;
    await prisma.branch.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Branch deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStocks = async (req: Request, res: Response) => {
  try {
    const branchId = req.query.branchId as string;
    const where = branchId ? { branchId: parseInt(branchId) } : {};
    const stocks = await prisma.stock.findMany({
      where,
      include: { branch: true }
    });
    res.json(stocks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
