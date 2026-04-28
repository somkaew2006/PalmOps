import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.weighTicket.findMany({
      include: {
        farmer: { select: { fullName: true, farmerCode: true } },
        vehicle: { select: { licensePlate: true } },
        price: true,
        branch: { select: { branchName: true } }
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
    const b = req.body;
    const { 
      farmerId, vehicleId, priceId, farmPlotId,
      grossWeightKg, tareWeightKg, 
      ffaPercent, oilPercent, moisturePercent, grade,
      deductionKg, deductionNote,
      pricePerKg, status, note, branchId, photoUrls
    } = b;

    if (!branchId) {
      return res.status(400).json({ message: 'กรุณาระบุสาขา' });
    }

    const gross = parseFloat(grossWeightKg || 0);
    const tare = parseFloat(tareWeightKg || 0);
    const ded = parseFloat(deductionKg || 0);
    const price = parseFloat(pricePerKg || 0);
    
    const net = gross - tare;
    const final = net - ded;
    const total = final * price;

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
        grossWeightKg: gross,
        tareWeightKg: tare,
        netWeightKg: net,
        ffaPercent: ffaPercent ? parseFloat(ffaPercent) : null,
        oilPercent: oilPercent ? parseFloat(oilPercent) : null,
        moisturePercent: moisturePercent ? parseFloat(moisturePercent) : null,
        grade: grade || 'A',
        deductionKg: ded,
        deductionNote: deductionNote || '',
        finalWeightKg: final,
        pricePerKg: price,
        totalAmount: total,
        status: status || 'draft',
        note: note || '',
        photoUrls: photoUrls || [],
        createdBy: (req as any).user?.id?.toString() || 'system',
        branchId: parseInt(branchId),
        weighInAt: new Date(),
        weighOutAt: (status === 'confirmed' || status === 'paid') ? new Date() : null
      },
      include: {
        farmer: true
      }
    });

    // If confirmed, update stock
    if (ticket.status === 'confirmed') {
      await prisma.stock.upsert({
        where: {
          branchId_grade: {
            branchId: ticket.branchId,
            grade: ticket.grade
          }
        },
        update: {
          quantityKg: { increment: final }
        },
        create: {
          branchId: ticket.branchId,
          grade: ticket.grade,
          quantityKg: final
        }
      });
    }

    res.status(201).json(ticket);
  } catch (error: any) {
    console.error('Create ticket error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const ticketId = parseInt(id);
    const data = { ...req.body };
    
    // Get existing ticket to check status change
    const existingTicket = await prisma.weighTicket.findUnique({ where: { id: ticketId } });
    if (!existingTicket) return res.status(404).json({ message: 'ไม่พบใบชั่งนี้' });

    // Calculate derived fields
    const gross = data.grossWeightKg !== undefined ? parseFloat(data.grossWeightKg) : existingTicket.grossWeightKg.toNumber();
    const tare = data.tareWeightKg !== undefined ? parseFloat(data.tareWeightKg) : existingTicket.tareWeightKg.toNumber();
    const ded = data.deductionKg !== undefined ? parseFloat(data.deductionKg) : existingTicket.deductionKg.toNumber();
    const price = data.pricePerKg !== undefined ? parseFloat(data.pricePerKg) : existingTicket.pricePerKg.toNumber();

    data.grossWeightKg = gross;
    data.tareWeightKg = tare;
    data.deductionKg = ded;
    data.pricePerKg = price;
    data.netWeightKg = gross - tare;
    data.finalWeightKg = data.netWeightKg - ded;
    data.totalAmount = data.finalWeightKg * price;

    if (data.ffaPercent !== undefined) data.ffaPercent = data.ffaPercent ? parseFloat(data.ffaPercent) : null;
    if (data.oilPercent !== undefined) data.oilPercent = data.oilPercent ? parseFloat(data.oilPercent) : null;
    if (data.moisturePercent !== undefined) data.moisturePercent = data.moisturePercent ? parseFloat(data.moisturePercent) : null;

    if (data.branchId) data.branchId = parseInt(data.branchId);
    if (data.farmerId) data.farmerId = parseInt(data.farmerId);
    if (data.vehicleId) data.vehicleId = parseInt(data.vehicleId);
    if (data.priceId) data.priceId = parseInt(data.priceId);

    // Set weighOutAt if status changes to confirmed/paid and it wasn't set
    if ((data.status === 'confirmed' || data.status === 'paid') && !existingTicket.weighOutAt) {
      data.weighOutAt = new Date();
    }

    const ticket = await prisma.weighTicket.update({
      where: { id: ticketId },
      data
    });

    // Handle stock update when status changes to confirmed
    if (existingTicket.status !== 'confirmed' && ticket.status === 'confirmed') {
      const final = ticket.finalWeightKg ? ticket.finalWeightKg.toNumber() : 0;

      await prisma.stock.upsert({
        where: {
          branchId_grade: {
            branchId: ticket.branchId,
            grade: ticket.grade
          }
        },
        update: {
          quantityKg: { increment: final }
        },
        create: {
          branchId: ticket.branchId,
          grade: ticket.grade,
          quantityKg: final
        }
      });
    }
    
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
