import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getProductGroups = async (req: Request, res: Response) => {
  try {
    const groups = await prisma.productGroup.findMany({
      include: { products: true }
    });
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.query;
    const where: any = {};
    if (groupId) where.groupId = parseInt(groupId as string);

    const products = await prisma.product.findMany({
      where,
      include: { group: true }
    });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createProductGroup = async (req: Request, res: Response) => {
  try {
    const { name, note } = req.body;
    const group = await prisma.productGroup.create({
      data: { name, note }
    });
    res.status(201).json(group);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, unit, groupId } = req.body;
    const product = await prisma.product.create({
      data: { 
        name, 
        unit, 
        groupId: parseInt(groupId as string) 
      }
    });
    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[DELETE] Product ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'รหัสสินค้าไม่ถูกต้อง' });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลสินค้า' });
    }

    // Check if product has expenses
    const productWithExpenses = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { expenses: true } } }
    });

    if (productWithExpenses?._count.expenses && productWithExpenses._count.expenses > 0) {
      return res.status(400).json({ message: 'ไม่สามารถลบได้เนื่องจากมีการใช้งานในรายการค่าใช้จ่ายแล้ว' });
    }

    await prisma.product.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'ลบสินค้าสำเร็จ' });
  } catch (error: any) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteProductGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if group has products
    const groupWithProducts = await prisma.productGroup.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { products: true } } }
    });

    if (groupWithProducts?._count.products && groupWithProducts._count.products > 0) {
      return res.status(400).json({ message: 'ไม่สามารถลบกลุ่มได้เนื่องจากมีสินค้าภายในกลุ่ม' });
    }

    await prisma.productGroup.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'ลบกลุ่มสินค้าสำเร็จ' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

