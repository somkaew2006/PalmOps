import { Request, Response } from 'express';
// ลบการ import prisma แบบ global ออก


export const getTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await req.db.weighTicket.findMany({
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
    const ticket = await req.db.weighTicket.findUnique({
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
    require('fs').appendFileSync('D:\\A\\Application\\PalmOps\\backend\\request_debug.log', '--- CREATE TICKET BODY --- ' + JSON.stringify(b) + '\n');
    const {
      farmerId, vehicleId, priceId, farmPlotId,
      grossWeightKg, tareWeightKg,
      ffaPercent, oilPercent, moisturePercent, grade,
      deductionKg, deductionNote,
      status, note, branchId, photoUrls, feeAmount
    } = b;

    const pricePerKg = b.pricePerKg;
    const totalAmount = req.body.totalAmount;

    if (!branchId) {
      return res.status(400).json({ message: 'กรุณาระบุสาขา' });
    }

    const gross = parseFloat(grossWeightKg || 0);
    const tare = parseFloat(tareWeightKg || 0);
    const ded = parseFloat(deductionKg || 0);
    const price = parseFloat(pricePerKg || 0);

    const net = gross - tare;
    const final = net - ded;
    const fee = parseFloat(feeAmount || 0);

    // Explicitly check for totalAmount in the request body
    let total;
    if (req.body.totalAmount !== undefined && req.body.totalAmount !== null && req.body.totalAmount !== '') {
      total = Number(req.body.totalAmount);
      console.log('--- USING MANUAL TOTAL AMOUNT ---', total);
    } else {
      total = (final * price) - fee;
      console.log('--- USING CALCULATED TOTAL AMOUNT ---', total);
    }

    // Generate robust unique ticket number for today
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    
    // Find the latest ticket for this company today to get the next sequence
    const latestTicket = await req.db.weighTicket.findFirst({
      where: {
        companyId: (req as any).user.companyId,
        ticketNo: { startsWith: `W${dateStr}` }
      },
      orderBy: { ticketNo: 'desc' },
      select: { ticketNo: true }
    });

    let nextSeq = 1;
    if (latestTicket && latestTicket.ticketNo) {
      // Extract the last 4 digits and increment
      const lastSeqStr = latestTicket.ticketNo.slice(-4);
      const lastSeq = parseInt(lastSeqStr);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
    const ticketNo = `W${dateStr}${nextSeq.toString().padStart(4, '0')}`;

    const ticket = await req.db.weighTicket.create({
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
        feeAmount: fee,
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
      await req.db.stock.upsert({
        where: {
          companyId_branchId_grade: {
            companyId: req.companyId!,
            branchId: ticket.branchId,
            grade: ticket.grade
          }


        },
        update: {
          quantityKg: { increment: final }
        },
        create: {
          companyId: req.companyId!,
          branchId: ticket.branchId,
          grade: ticket.grade,
          quantityKg: final
        }

      });
    }

    res.status(201).json(ticket);
  } catch (error: any) {
    console.error('--- CREATE TICKET ERROR ---', error);
    // Log more details if it's a Prisma error
    if (error.code) {
      console.error('Prisma Error Code:', error.code);
      console.error('Prisma Error Meta:', error.meta);
    }
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการบันทึกใบชั่ง', 
      error: error.message,
      details: error.meta || null
    });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const ticketId = parseInt(id);
    const data = { ...req.body };
    require('fs').appendFileSync('D:\\A\\Application\\PalmOps\\backend\\request_debug.log', '--- UPDATE TICKET BODY --- ' + JSON.stringify(data) + '\n');

    // Get existing ticket to check status change
    const existingTicket = await req.db.weighTicket.findUnique({ where: { id: ticketId } });
    if (!existingTicket) return res.status(404).json({ message: 'ไม่พบใบชั่งนี้' });

    // Calculate derived fields
    const gross = data.grossWeightKg !== undefined ? parseFloat(data.grossWeightKg) : existingTicket.grossWeightKg.toNumber();
    const tare = data.tareWeightKg !== undefined ? parseFloat(data.tareWeightKg) : existingTicket.tareWeightKg.toNumber();
    const ded = data.deductionKg !== undefined ? parseFloat(data.deductionKg) : existingTicket.deductionKg.toNumber();
    const price = data.pricePerKg !== undefined ? parseFloat(data.pricePerKg) : existingTicket.pricePerKg.toNumber();
    const fee = data.feeAmount !== undefined ? parseFloat(data.feeAmount) : existingTicket.feeAmount.toNumber();

    data.grossWeightKg = gross;
    data.tareWeightKg = tare;
    data.deductionKg = ded;
    data.pricePerKg = price;
    data.feeAmount = fee;
    data.netWeightKg = gross - tare;
    data.finalWeightKg = data.netWeightKg - ded;

    // Logic for totalAmount update:
    // 1. If manual totalAmount is provided in body, use it.
    // 2. If weight or price is changed in body, recalculate it.
    // 3. Otherwise, use the existing totalAmount.

    const isWeightOrPriceChanged =
      req.body.grossWeightKg !== undefined ||
      req.body.tareWeightKg !== undefined ||
      req.body.deductionKg !== undefined ||
      req.body.pricePerKg !== undefined;

    if (req.body.totalAmount !== undefined && req.body.totalAmount !== null && req.body.totalAmount !== '') {
      data.totalAmount = Number(req.body.totalAmount);
      console.log('--- USING MANUAL TOTAL AMOUNT (UPDATE) ---', data.totalAmount);
    } else if (isWeightOrPriceChanged) {
      data.totalAmount = (data.finalWeightKg * price) - fee;
      console.log('--- RECALCULATING TOTAL DUE TO WEIGHT/PRICE CHANGE ---', data.totalAmount);
    } else {
      // Preserve existing total, but adjust for fee if fee was changed
      const oldFee = existingTicket.feeAmount.toNumber();
      const feeDiff = fee - oldFee;
      data.totalAmount = existingTicket.totalAmount.toNumber() - feeDiff;
      console.log('--- PRESERVING EXISTING TOTAL (ADJUSTED FOR FEE) ---', data.totalAmount);
    }

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

    const ticket = await req.db.weighTicket.update({
      where: { id: ticketId },
      data
    });

    // Handle stock update when status changes to confirmed
    if (existingTicket.status !== 'confirmed' && ticket.status === 'confirmed') {
      const final = ticket.finalWeightKg ? ticket.finalWeightKg.toNumber() : 0;

      await req.db.stock.upsert({
        where: {
          companyId_branchId_grade: {
            companyId: req.companyId!,
            branchId: ticket.branchId,
            grade: ticket.grade
          }


        },
        update: {
          quantityKg: { increment: final }
        },
        create: {
          companyId: req.companyId!,
          branchId: ticket.branchId,
          grade: ticket.grade,
          quantityKg: final
        }

      });
    }

    // Handle Payment creation when status changes to paid
    if (existingTicket.status !== 'paid' && ticket.status === 'paid') {
      const totalAmount = ticket.totalAmount ? ticket.totalAmount.toNumber() : 0;

      // Generate unique payment reference
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const paymentCount = await req.db.payment.count();
      const paymentRef = `PV${dateStr}${(paymentCount + 1).toString().padStart(4, '0')}`;

      await req.db.payment.create({
        data: {
          paymentRef,
          farmerId: ticket.farmerId,
          amount: totalAmount,
          method: 'bank_transfer',
          status: 'completed',
          branchId: ticket.branchId,
          createdBy: (req as any).user?.id?.toString() || 'system',
          paymentDate: new Date(),
          // Link via PaymentItem
          items: {
            create: {
              companyId: req.companyId!,
              ticketId: ticket.id,
              amount: totalAmount
            }

          }
        }
      });
    }

    res.json(ticket);
  } catch (error: any) {
    console.error('Update ticket error:', error);
    res.status(400).json({ message: error.message, stack: error.stack });
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await req.db.weighTicket.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'ลบใบชั่งเรียบร้อยแล้ว' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
