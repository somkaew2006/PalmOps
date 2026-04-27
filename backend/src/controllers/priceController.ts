import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getPrices = async (req: Request, res: Response) => {
  try {
    const prices = await prisma.dailyPrice.findMany({
      orderBy: { priceDate: 'desc' }
    });
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prices', error });
  }
};

export const getTodayPrice = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const price = await prisma.dailyPrice.findFirst({
      where: {
        priceDate: {
          equals: today
        }
      }
    });

    if (!price) {
      // Return the most recent price if today's is not set
      const latestPrice = await prisma.dailyPrice.findFirst({
        orderBy: { priceDate: 'desc' }
      });
      return res.json(latestPrice || { 
        priceGradeA: 0, 
        priceGradeB: 0, 
        priceGradeC: 0, 
        ffaThresholdA: 5, 
        ffaThresholdB: 7 
      });
    }

    res.json(price);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching today price', error });
  }
};

export const createPrice = async (req: Request, res: Response) => {
  try {
    const { priceDate, priceGradeA, priceGradeB, priceGradeC, referenceSource, note } = req.body;
    
    // Check if price for this date already exists
    const date = new Date(priceDate);
    date.setHours(0, 0, 0, 0);

    const existing = await prisma.dailyPrice.findUnique({
      where: { priceDate: date }
    });

    if (existing) {
      return res.status(400).json({ message: 'ราคาวันนี้มีอยู่แล้ว กรุณาใช้การแก้ไขแทน' });
    }

    const price = await prisma.dailyPrice.create({
      data: {
        priceDate: date,
        priceGradeA,
        priceGradeB,
        priceGradeC,
        referenceSource: referenceSource || 'MPOB',
        note
      }
    });

    res.status(201).json(price);
  } catch (error) {
    res.status(500).json({ message: 'Error creating price', error });
  }
};

export const updatePrice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { priceGradeA, priceGradeB, priceGradeC, referenceSource, note } = req.body;

    const price = await prisma.dailyPrice.update({
      where: { id: parseInt(id) },
      data: {
        priceGradeA,
        priceGradeB,
        priceGradeC,
        referenceSource,
        note
      }
    });

    res.json(price);
  } catch (error) {
    res.status(500).json({ message: 'Error updating price', error });
  }
};

export const deletePrice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.dailyPrice.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Price deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting price', error });
  }
};
