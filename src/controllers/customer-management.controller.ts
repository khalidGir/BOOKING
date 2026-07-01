import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { invalidateOnBookingChange } from '../services/slot-cache-invalidator.js';

export async function getBookingByToken(req: Request, res: Response): Promise<void> {
  try {
    const token = String(req.params.token);

    const booking = await prisma.$withBypass().booking.findUnique({
      where: { manageToken: token },
      select: {
        id: true,
        bookingRef: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        startTime: true,
        endTime: true,
        duration: true,
        price: true,
        status: true,
        notes: true,
        service: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
        location: { select: { id: true, name: true, address: true } },
        business: { select: { id: true, name: true, slug: true, cancellationHours: true, timezone: true, phone: true, email: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.json({ data: booking });
  } catch (error) {
    console.error('[customer:get]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function cancelBookingByToken(req: Request, res: Response): Promise<void> {
  try {
    const token = String(req.params.token);

    const booking = await prisma.$withBypass().booking.findUnique({
      where: { manageToken: token },
      select: {
        id: true,
        businessId: true,
        startTime: true,
        status: true,
        business: { select: { cancellationHours: true, timezone: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.status === 'CANCELLED') {
      res.status(400).json({ error: 'Booking is already cancelled' });
      return;
    }

    const cancellationHours = booking.business.cancellationHours;
    if (cancellationHours > 0) {
      const now = new Date();
      const diffMs = booking.startTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < cancellationHours) {
        res.status(400).json({
          error: `Cancellation window has passed. Cancellations must be made at least ${cancellationHours} hours before the appointment.`,
          canCancel: false,
          hoursUntilAppointment: Math.round(diffHours * 10) / 10,
        });
        return;
      }
    }

    await prisma.$withBypass().booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED', cancelledBy: 'CUSTOMER' },
    });

    await invalidateOnBookingChange(booking.businessId, booking.startTime);

    res.json({ data: { id: booking.id, status: 'CANCELLED' } });
  } catch (error) {
    console.error('[customer:cancel]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
