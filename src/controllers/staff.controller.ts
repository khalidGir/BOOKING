import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';

export async function listStaff(_req: Request, res: Response): Promise<void> {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { name: 'asc' },
      include: {
        services: { include: { service: { select: { id: true, name: true } } } },
        _count: { select: { bookings: true } },
      },
    });

    res.json({ data: staff });
  } catch (error) {
    console.error('[staff:list]', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
}

export async function getStaff(req: Request, res: Response): Promise<void> {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: String(req.params.id) },
      include: {
        services: { include: { service: { select: { id: true, name: true } } } },
        availabilities: true,
        overrides: true,
      },
    });

    if (!staff) {
      res.status(404).json({ error: 'Staff not found' });
      return;
    }

    res.json({ data: staff });
  } catch (error) {
    console.error('[staff:get]', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
}

export async function createStaff(req: Request, res: Response): Promise<void> {
  const { serviceIds, ...data } = req.body;

  try {
    const staff = await prisma.staff.create({
      data: {
        ...data,
        ...(serviceIds ? {
          services: {
            create: serviceIds.map((serviceId: string) => ({ serviceId })),
          },
        } : {}),
      },
    });

    res.status(201).json({ data: staff });
  } catch (error: any) {
    console.error('[staff:create]', error);
    if (error?.code === 'P2002') {
      res.status(409).json({ error: 'Staff with this email already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to create staff' });
  }
}

export async function updateStaff(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { serviceIds, ...data } = req.body;

  try {
    const existing = await prisma.staff.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      res.status(404).json({ error: 'Staff not found' });
      return;
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        ...data,
        ...(serviceIds !== undefined
          ? {
              services: {
                deleteMany: {},
                create: serviceIds.map((serviceId: string) => ({ serviceId })),
              },
            }
          : {}),
      },
    });

    res.json({ data: staff });
  } catch (error: any) {
    console.error('[staff:update]', error);
    if (error?.code === 'P2002') {
      res.status(409).json({ error: 'Staff with this email already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to update staff' });
  }
}

export async function toggleStaffActive(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const staff = await prisma.staff.findUnique({ where: { id }, select: { id: true, isActive: true } });

    if (!staff) {
      res.status(404).json({ error: 'Staff not found' });
      return;
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: { isActive: !staff.isActive },
    });

    res.json({ data: updated });
  } catch (error) {
    console.error('[staff:toggle]', error);
    res.status(500).json({ error: 'Failed to toggle staff' });
  }
}

export async function createAvailability(req: Request, res: Response): Promise<void> {
  const { staffId, dayOfWeek, startTime, endTime, isActive } = req.body;

  try {
    const staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { id: true } });
    if (!staff) {
      res.status(404).json({ error: 'Staff not found' });
      return;
    }

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    const startDateTime = new Date();
    startDateTime.setUTCHours(sh, sm, 0, 0);

    const endDateTime = new Date();
    endDateTime.setUTCHours(eh, em, 0, 0);

    const availability = await prisma.staffAvailability.create({
      data: {
        staffId,
        dayOfWeek,
        startTime: startDateTime,
        endTime: endDateTime,
        isActive: isActive ?? true,
      },
    });

    res.status(201).json({ data: availability });
  } catch (error) {
    console.error('[staff:avail:create]', error);
    res.status(500).json({ error: 'Failed to create availability' });
  }
}

export async function updateAvailability(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { startTime, endTime, ...data } = req.body;

  try {
    const updateData: any = { ...data };

    if (startTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const d = new Date();
      d.setUTCHours(sh, sm, 0, 0);
      updateData.startTime = d;
    }

    if (endTime) {
      const [eh, em] = endTime.split(':').map(Number);
      const d = new Date();
      d.setUTCHours(eh, em, 0, 0);
      updateData.endTime = d;
    }

    const availability = await prisma.staffAvailability.update({
      where: { id },
      data: updateData,
    });

    res.json({ data: availability });
  } catch (error) {
    console.error('[staff:avail:update]', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
}

export async function deleteAvailability(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    await prisma.staffAvailability.delete({ where: { id } });
    res.json({ data: { id, deleted: true } });
  } catch (error) {
    console.error('[staff:avail:delete]', error);
    res.status(500).json({ error: 'Failed to delete availability' });
  }
}

export async function createOverride(req: Request, res: Response): Promise<void> {
  const { staffId, date, startTime, endTime, reason } = req.body;

  try {
    const staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { id: true } });
    if (!staff) {
      res.status(404).json({ error: 'Staff not found' });
      return;
    }

    const override = await prisma.staffAvailabilityOverride.create({
      data: {
        staffId,
        date: new Date(date),
        ...(startTime ? { startTime: (() => {
          const [h, m] = startTime.split(':').map(Number);
          const d = new Date();
          d.setUTCHours(h, m, 0, 0);
          return d;
        })() } : {}),
        ...(endTime ? { endTime: (() => {
          const [h, m] = endTime.split(':').map(Number);
          const d = new Date();
          d.setUTCHours(h, m, 0, 0);
          return d;
        })() } : {}),
        reason,
      },
    });

    res.status(201).json({ data: override });
  } catch (error) {
    console.error('[staff:override:create]', error);
    res.status(500).json({ error: 'Failed to create override' });
  }
}

export async function updateOverride(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  try {
    const existing = await prisma.staffAvailabilityOverride.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Override not found' });
      return;
    }

    const { startTime, endTime, ...data } = req.body;

    const updateData: any = { ...data };
    if (startTime !== undefined) {
      if (startTime === null) {
        updateData.startTime = null;
      } else {
        const [h, m] = startTime.split(':').map(Number);
        const d = new Date();
        d.setUTCHours(h, m, 0, 0);
        updateData.startTime = d;
      }
    }
    if (endTime !== undefined) {
      if (endTime === null) {
        updateData.endTime = null;
      } else {
        const [h, m] = endTime.split(':').map(Number);
        const d = new Date();
        d.setUTCHours(h, m, 0, 0);
        updateData.endTime = d;
      }
    }

    const override = await prisma.staffAvailabilityOverride.update({
      where: { id },
      data: updateData,
    });

    res.json({ data: override });
  } catch (error) {
    console.error('[staff:override:update]', error);
    res.status(500).json({ error: 'Failed to update override' });
  }
}

export async function deleteOverride(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    await prisma.staffAvailabilityOverride.delete({ where: { id } });
    res.json({ data: { id, deleted: true } });
  } catch (error) {
    console.error('[staff:override:delete]', error);
    res.status(500).json({ error: 'Failed to delete override' });
  }
}
