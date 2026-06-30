import type { Request, Response } from 'express';
import { reserveSlot, confirmBooking } from '../services/reservation.js';
import { invalidateOnBookingChange } from '../services/slot-cache-invalidator.js';
import { prisma } from '../utils/prisma.js';

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
    const { booking } = await confirmBooking(tenantId, reservationToken, {
      bookingRef: '',
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      notes: customer.notes,
      startTime: new Date(startTime),
      duration: req.body.duration ?? 60,
      price: req.body.price ?? 0,
      serviceId,
      staffId: staffId ?? null,
      locationId: req.body.locationId ?? null,
      customFieldAnswers: req.body.customFieldAnswers ?? undefined,
    });

    res.status(201).json({ data: booking });
  } catch (error: any) {
    if (error.code === 'TOKEN_EXPIRED') {
      res.status(409).json({ error: 'Reservation token expired or invalid — please reserve again' });
      return;
    }
    if (error.code === 'SLOT_UNAVAILABLE') {
      res.status(409).json({ error: 'Slot became unavailable — please choose another time' });
      return;
    }
    console.error('[confirm] error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleRelease(req: Request, res: Response): Promise<void> {
  const { releaseSlot } = await import('../services/reservation.js');
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

export async function handleCancel(req: Request, res: Response): Promise<void> {
  const tenantId = (req as any).tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Tenant context required' });
    return;
  }

  const bookingId = req.params.bookingId;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: String(bookingId) },
      select: { id: true, startTime: true, status: true },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.status === 'CANCELLED') {
      res.status(400).json({ error: 'Booking is already cancelled' });
      return;
    }

    await prisma.booking.update({
      where: { id: String(bookingId) },
      data: { status: 'CANCELLED' },
    });

    await invalidateOnBookingChange(tenantId, booking.startTime);

    res.status(200).json({ data: { id: booking.id, status: 'CANCELLED' } });
  } catch (error) {
    console.error('[cancel] error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
