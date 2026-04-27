import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getVehicle = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(id) }
    });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.create({
      data: req.body
    });
    res.status(201).json(vehicle);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const vehicle = await prisma.vehicle.update({
      where: { id: parseInt(id) },
      data: req.body
    });
    res.json(vehicle);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.vehicle.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
