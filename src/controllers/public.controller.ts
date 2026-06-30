import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { publicSlotsQuerySchema } from '../validations/booking.validation.js';

export async function getBusinessServices(req: Request, res: Response): Promise<void> {
  try {
    const slug = String(req.params.slug);

    const business = await prisma.$withBypass().business.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, logoUrl: true, brandColor: true, timezone: true },
    });

    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    const services = await prisma.$withBypass().service.findMany({
      where: { businessId: business.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        category: { select: { id: true, name: true, sortOrder: true } },
        customFields: {
          select: { id: true, label: true, fieldType: true, isRequired: true, options: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json({
      data: {
        business,
        services,
      },
    });
  } catch (error) {
    console.error('[public:services]', error);
    res.status(500).json({ error: 'Failed to fetch business services' });
  }
}

export async function getAvailableSlots(req: Request, res: Response): Promise<void> {
  try {
    const slug = String(req.params.slug);

    const business = await prisma.$withBypass().business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    const parsed = publicSlotsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { serviceId, date, staffId } = parsed.data;
    const dayStart = new Date(date + 'T00:00:00.000Z');
    const dayEnd = new Date(date + 'T23:59:59.999Z');

    const where: any = {
      businessId: business.id,
      serviceId,
      startTime: { gte: dayStart, lte: dayEnd },
      isAvailable: true,
    };

    if (staffId) {
      where.staffId = staffId;
    }

    const slots = await prisma.$withBypass().slotCache.findMany({
      where,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        staffId: true,
      },
      orderBy: { startTime: 'asc' },
    });

    res.json({ data: slots });
  } catch (error) {
    console.error('[public:slots]', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
}
