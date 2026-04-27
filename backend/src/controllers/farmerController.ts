import { Request, Response } from 'express';
import prisma from '../config/prisma';

console.log('!!! FARMER CONTROLLER LOADED !!!');

export const getFarmers = async (req: Request, res: Response) => {
  try {
    const farmers = await prisma.farmer.findMany({
      include: {
        _count: {
          select: { farmPlots: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(farmers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFarmer = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const farmer = await prisma.farmer.findUnique({
      where: { id: parseInt(id) },
      include: { farmPlots: true }
    });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    res.json(farmer);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createFarmer = async (req: Request, res: Response) => {
  console.log('--- ATTEMPTING TO CREATE FARMER (REFACTORED) ---');
  try {
    const { fullName, nationalId, phone, address, province, district, subdistrict, isActive, bankName, bankAccount, bankBranch, lineId, note, farmPlots } = req.body;

    const createData: any = {
      fullName,
      phone,
      address,
      province,
      district,
      subdistrict,
      isActive: isActive === false ? false : true,
      bankName,
      bankAccount,
      bankBranch,
      lineId,
      note
    };

    if (nationalId) {
      const existing = await prisma.farmer.findUnique({ where: { nationalId } });
      if (existing) return res.status(400).json({ message: 'เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว' });
      createData.nationalId = nationalId;
    }

    createData.farmerCode = req.body.farmerCode || `F${Date.now().toString().slice(-6)}`;

    if (Array.isArray(farmPlots) && farmPlots.length > 0) {
      createData.farmPlots = {
        create: farmPlots.map((p: any) => ({
          plotCode: p.plotCode || `P${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          titleDeedNo: p.titleDeedNo || null,
          areaRai: parseFloat(p.areaRai) || 0,
          gpsLat: p.gpsLat ? parseFloat(p.gpsLat) : null,
          gpsLng: p.gpsLng ? parseFloat(p.gpsLng) : null,
          palmAgeYears: p.palmAgeYears ? parseInt(p.palmAgeYears) : null,
          province: p.province || null,
          district: p.district || null,
          subdistrict: p.subdistrict || null
        }))
      };
    }

    console.log('Sending to Prisma (Create):', JSON.stringify(createData, null, 2));

    const farmer = await prisma.farmer.create({
      data: createData,
      include: { farmPlots: true }
    });
    res.status(201).json(farmer);
  } catch (error: any) {
    console.error('CRITICAL CREATE ERROR:', error);
    res.status(400).json({ message: error.message });
  }
};

export const updateFarmer = async (req: Request, res: Response) => {
  console.log('--- ATTEMPTING TO UPDATE FARMER (REFACTORED) ---');
  try {
    const id = req.params.id as string;
    const fId = parseInt(id);
    const { fullName, nationalId, phone, address, province, district, subdistrict, isActive, bankName, bankAccount, bankBranch, lineId, note, farmPlots } = req.body;

    // Explicitly construct the data object to avoid ANY unintended fields
    const updateData: any = {
      fullName,
      nationalId,
      phone,
      address,
      province,
      district,
      subdistrict,
      isActive: isActive === false ? false : true,
      bankName,
      bankAccount,
      bankBranch,
      lineId,
      note
    };

    if (Array.isArray(farmPlots)) {
      // Step 1: Remove existing plots to simplify the update structure
      await prisma.farmPlot.deleteMany({
        where: { farmerId: fId }
      });

      // Step 2: Use create for new plots
      updateData.farmPlots = {
        create: farmPlots.map((p: any) => ({
          plotCode: p.plotCode || `P${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          titleDeedNo: p.titleDeedNo || null,
          areaRai: parseFloat(p.areaRai) || 0,
          gpsLat: p.gpsLat ? parseFloat(p.gpsLat) : null,
          gpsLng: p.gpsLng ? parseFloat(p.gpsLng) : null,
          palmAgeYears: p.palmAgeYears ? parseInt(p.palmAgeYears) : null,
          province: p.province || null,
          district: p.district || null,
          subdistrict: p.subdistrict || null
        }))
      };
    }

    console.log('Sending to Prisma (Update):', JSON.stringify(updateData, null, 2));

    const farmer = await prisma.farmer.update({
      where: { id: fId },
      data: updateData,
      include: { farmPlots: true }
    });
    
    res.json(farmer);
  } catch (error: any) {
    console.error('CRITICAL UPDATE ERROR:', error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteFarmer = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.farmer.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Farmer deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
