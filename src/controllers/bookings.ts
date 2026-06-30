import type { Request, Response } from 'express';
import { reserveSlot, releaseSlot } from '../services/reservation.js';
import { prisma } from '../utils/prisma.js';
import crypto from 'node:crypto';

export async function handleReserve(req: Request, res: Response): Promise<void> {
  const tenantId = (req as any).tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Tenant context required' });
    return;
  }

  const { serviceId, staffId, startTime } = req.body;

  if (!serviceId || !startTime) {
    res.status(400).json({ error: 'serviceId and startTime are required' });
    return;
  }

  try {
    const result = await reserveSlot(
      tenantId,
      serviceId,
      staffId ?? null,
      new Date(startTime),
    );

    if (!result.success) {
      const status = result.reason === 'already_held' ? 409 : 404;
      const message =
        result.reason === 'already_held'
          ? 'This slot is currently held by another customer'
          : result.reason === 'not_available'
            ? 'This slot is no longer available'
            : 'Slot not found';
      res.status(status).json({ error: message, reason: result.reason });
      return;
    }

    res.status(200).json({
      reservationToken: result.reservationToken,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('[reserve] error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleConfirm(req: Request, res: Response): Promise<void> {
  const tenantId = (req as any).tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Tenant context required' });
    return;
  }

  const { serviceId, staffId, startTime, reservationToken, customer } = req.body;

  if (!serviceId || !startTime || !reservationToken || !customer?.name || !customer?.email || !customer?.phone) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const held = await releaseSlot(tenantId, staffId ?? null, new Date(startTime).toISOString(), reservationToken);
    if (!held) {
      res.status(409).json({ error: 'Reservation token expired or invalid — slot may have been taken' });
      return;
    }

    const bookingRef = `BK-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    const manageToken = crypto.randomUUID();

    const booking = await prisma.booking.create({
      data: {
        businessId: '',
        bookingRef,
        manageToken,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        notes: customer.notes,
        startTime: new Date(startTime),
        endTime: new Date(new Date(startTime).getTime() + (req.body.duration ?? 60) * 60000),
        duration: req.body.duration ?? 60,
        price: req.body.price ?? 0,
        serviceId,
        staffId: staffId ?? null,
      } as any,
    });

    await prisma.slotCache.updateMany({
      where: {
        businessId: tenantId,
        serviceId,
        staffId: staffId ?? null,
        startTime: new Date(startTime),
      },
      data: { isAvailable: false },
    });

    res.status(201).json({ data: booking });
  } catch (error) {
    console.error('[confirm] error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleRelease(req: Request, res: Response): Promise<void> {
  const tenantId = (req as any).tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Tenant context required' });
    return;
  }

  const { staffId, startTime, reservationToken } = req.body;

  if (!startTime || !reservationToken) {
    res.status(400).json({ error: 'startTime and reservationToken are required' });
    return;
  }

  try {
    const released = await releaseSlot(tenantId, staffId ?? null, new Date(startTime).toISOString(), reservationToken);
    res.status(200).json({ released });
  } catch (error) {
    console.error('[release] error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
