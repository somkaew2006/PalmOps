import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.weighTicket.findMany({
      include: {
        farmer: { select: { fullName: true, farmerCode: true } },
        vehicle: { select: { licensePlate: true } },
        price: true
      },
      orderBy: { weighInAt: 'desc' }
    });
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTicket = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const ticket = await prisma.weighTicket.findUnique({
      where: { id: parseInt(id) },
      include: {
        farmer: true,
        vehicle: true,
        price: true,
        farmPlot: true
      }
    });
    if (!ticket) return res.status(404).json({ message: 'ไม่พบใบชั่งนี้' });
    res.json(ticket);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const { 
      farmerId, vehicleId, priceId, farmPlotId,
      grossWeightKg, tareWeightKg, netWeightKg,
      ffaPercent, oilPercent, grade,
      deductionKg, deductionNote,
      finalWeightKg, pricePerKg, totalAmount,
      status, note
    } = req.body;

    // Generate unique ticket number
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const ticketCount = await prisma.weighTicket.count();
    const ticketNo = `W${dateStr}${(ticketCount + 1).toString().padStart(4, '0')}`;
    
    const ticket = await prisma.weighTicket.create({
      data: {
        ticketNo,
        farmerId: parseInt(farmerId),
        vehicleId: vehicleId ? parseInt(vehicleId) : null,
        priceId: parseInt(priceId),
        farmPlotId: farmPlotId ? parseInt(farmPlotId) : null,
        grossWeightKg: parseFloat(grossWeightKg),
        tareWeightKg: parseFloat(tareWeightKg),
        ffaPercent: ffaPercent ? parseFloat(ffaPercent) : null,
        oilPercent: oilPercent ? parseFloat(oilPercent) : null,
        grade: grade || 'A',
        deductionKg: deductionKg ? parseFloat(deductionKg) : 0,
        deductionNote,
        pricePerKg: parseFloat(pricePerKg),
        status: status || 'draft',
        note,
        weighInAt: new Date()
      },
      include: {
        farmer: true
      }
    });
    res.status(201).json(ticket);
  } catch (error: any) {
    console.error('Create ticket error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = { ...req.body };
    
    // Convert numeric strings to numbers if present
    const numericFields = [
      'grossWeightKg', 'tareWeightKg', 'netWeightKg', 
      'ffaPercent', 'oilPercent', 'deductionKg', 
      'finalWeightKg', 'pricePerKg', 'totalAmount'
    ];
    
    numericFields.forEach(field => {
      if (data[field] !== undefined) data[field] = parseFloat(data[field]);
    });

    // Remove generated columns from update data
    delete data.netWeightKg;
    delete data.finalWeightKg;
    delete data.totalAmount;

    const ticket = await prisma.weighTicket.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(ticket);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.weighTicket.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'ลบใบชั่งเรียบร้อยแล้ว' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
