import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getSales = async (req: Request, res: Response) => {
  try {
    const sales = await prisma.sale.findMany({
      include: { branch: true },
      orderBy: { saleDate: 'desc' }
    });
    res.json(sales);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createSale = async (req: Request, res: Response) => {
  try {
    const { 
      branchId, customerName, saleDate, grade, 
      quantityKg, pricePerKg, totalAmount, note 
    } = req.body;

    const branchIdInt = parseInt(branchId);
    const qty = parseFloat(quantityKg);

    // Check if enough stock
    const stock = await prisma.stock.findUnique({
      where: {
        branchId_grade: {
          branchId: branchIdInt,
          grade: grade
        }
      }
    });

    if (!stock || stock.quantityKg.toNumber() < qty) {
      return res.status(400).json({ message: 'สินค้าในสต็อกไม่เพียงพอ' });
    }

    // Use transaction to create sale and deduct stock
    const result = await prisma.$transaction(async (tx) => {
      // Generate sale number
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const saleCount = await tx.sale.count();
      const saleNo = `S${dateStr}${(saleCount + 1).toString().padStart(4, '0')}`;

      const sale = await tx.sale.create({
        data: {
          saleNo,
          branchId: branchIdInt,
          customerName,
          saleDate: saleDate ? new Date(saleDate) : new Date(),
          grade,
          quantityKg: qty,
          pricePerKg: parseFloat(pricePerKg),
          totalAmount: totalAmount ? parseFloat(totalAmount) : (qty * parseFloat(pricePerKg)),
          note,
          status: 'completed'
        }
      });

      // Deduct stock
      await tx.stock.update({
        where: {
          branchId_grade: {
            branchId: branchIdInt,
            grade: grade
          }
        },
        data: {
          quantityKg: { decrement: qty }
        }
      });

      return sale;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Create sale error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const cancelSale = async (req: Request, res: Response) => {
  try {
    const idStr = req.params.id as string;
    const id = parseInt(idStr);
    
    const sale = await prisma.sale.findUnique({ where: { id } });
    if (!sale) return res.status(404).json({ message: 'ไม่พบรายการขาย' });
    if (sale.status === 'cancelled') return res.status(400).json({ message: 'รายการนี้ถูกยกเลิกไปแล้ว' });

    // Transaction to cancel sale and restore stock
    const result = await prisma.$transaction(async (tx) => {
      const updatedSale = await tx.sale.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      // Restore stock
      await tx.stock.update({
        where: {
          branchId_grade: {
            branchId: sale.branchId,
            grade: sale.grade
          }
        },
        data: {
          quantityKg: { increment: sale.quantityKg }
        }
      });

      return updatedSale;
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
