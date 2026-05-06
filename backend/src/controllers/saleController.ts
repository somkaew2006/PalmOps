import { Request, Response } from 'express';


export const getSales = async (req: Request, res: Response) => {
  try {
    const { branchId, month, year, isTransfer } = req.query;
    const where: any = {};
    
    if (branchId) {
      where.branchId = parseInt(branchId as string);
    }

    if (isTransfer === 'true') {
      where.toBranchId = { not: null };
    } else if (isTransfer === 'false') {
      where.toBranchId = null;
    }
    
    if (month && year) {
      const m = parseInt(month as string);
      const y = parseInt(year as string);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59, 999);
      where.saleDate = { gte: startDate, lte: endDate };
    }

    const sales = await req.db.sale.findMany({
      where,
      include: { 
        branch: true,
        customer: true,
        toBranch: true
      },
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
      branchId, customerId, customerName, toBranchId, saleDate, grade, 
      quantityKg, pricePerKg, totalAmount, note 
    } = req.body;

    const branchIdInt = parseInt(branchId);
    const qty = parseFloat(quantityKg);

    // Check if enough stock in source branch
    const stock = await req.db.stock.findUnique({
      where: {
        companyId_branchId_grade: {
          companyId: req.companyId!,
          branchId: branchIdInt,
          grade: grade
        }
      }
    });

    if (!stock || stock.quantityKg.toNumber() < qty) {
      return res.status(400).json({ message: 'สินค้าในสต็อกไม่เพียงพอ' });
    }

    // Use transaction to create sale and update stocks
    const result = await req.db.$transaction(async (tx) => {
      // Generate sale number
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const saleCount = await tx.sale.count();
      const saleNo = `S${dateStr}${(saleCount + 1).toString().padStart(4, '0')}`;

      const sale = await tx.sale.create({
        data: {
          saleNo,
          branchId: branchIdInt,
          customerId: customerId && customerId !== 'other' && customerId !== 'branch' ? parseInt(customerId) : null,
          customerName: customerId === 'branch' ? `โอนย้ายไปสาขา ${req.body.toBranchName}` : customerName,
          toBranchId: toBranchId ? parseInt(toBranchId) : null,
          saleDate: saleDate ? new Date(saleDate) : new Date(),
          grade,
          quantityKg: qty,
          pricePerKg: parseFloat(pricePerKg),
          totalAmount: totalAmount ? parseFloat(totalAmount) : (qty * parseFloat(pricePerKg)),
          note,
          status: 'completed'
        }
      });

      // 1. Deduct stock from source branch
      await tx.stock.update({
        where: {
          companyId_branchId_grade: {
            companyId: req.companyId!,
            branchId: branchIdInt,
            grade: grade
          }
        },
        data: {
          quantityKg: { decrement: qty }
        }
      });

      // 2. If it's a transfer to another branch, increment stock in the target branch
      if (toBranchId) {
        const targetBranchId = parseInt(toBranchId);

        // Update stock in target branch
        await tx.stock.upsert({
          where: {
            companyId_branchId_grade: {
              companyId: req.companyId!,
              branchId: targetBranchId,
              grade: grade
            }
          },
          update: {
            quantityKg: { increment: qty }
          },
          create: {
            companyId: req.companyId!,
            branchId: targetBranchId,
            grade: grade,
            quantityKg: qty
          }
        });
      }

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
    
    const sale = await req.db.sale.findUnique({ where: { id } });
    if (!sale) return res.status(404).json({ message: 'ไม่พบรายการขาย' });
    if (sale.status === 'cancelled') return res.status(400).json({ message: 'รายการนี้ถูกยกเลิกไปแล้ว' });

    // Transaction to cancel sale and restore stocks
    const result = await req.db.$transaction(async (tx) => {
      const updatedSale = await tx.sale.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      // 1. Restore stock to source branch
      await tx.stock.update({
        where: {
          companyId_branchId_grade: {
            companyId: req.companyId!,
            branchId: sale.branchId,
            grade: sale.grade
          }
        },
        data: {
          quantityKg: { increment: sale.quantityKg }
        }
      });

      if (sale.toBranchId) {
        await tx.stock.update({
          where: {
            companyId_branchId_grade: {
              companyId: req.companyId!,
              branchId: sale.toBranchId,
              grade: sale.grade
            }
          },
          data: {
            quantityKg: { decrement: sale.quantityKg }
          }
        });
      }

      return updatedSale;
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
