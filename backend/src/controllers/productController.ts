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
        groupId: parseInt(groupId) 
      }
    });
    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

