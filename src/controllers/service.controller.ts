import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { createServiceSchema, updateServiceSchema } from '../validations/service.validation.js';
import { invalidateOnStaffAvailabilityChange } from '../services/slot-cache-invalidator.js';
import { getTenantContext } from '../middleware/tenant-context.js';

export async function listServices(_req: Request, res: Response): Promise<void> {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { category: true, customFields: true },
    });

    res.json({ data: services });
  } catch (error) {
    console.error('[services:list]', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
}

export async function getService(req: Request, res: Response): Promise<void> {
  try {
    const service = await prisma.service.findUnique({
      where: { id: String(req.params.id) },
      include: { category: true, customFields: true },
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json({ data: service });
  } catch (error) {
    console.error('[services:get]', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
}

export async function createService(req: Request, res: Response): Promise<void> {
  const parsed = createServiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const service = await prisma.service.create({
      data: {
        ...parsed.data,
        businessId: '',
      } as any,
    });

    res.status(201).json({ data: service });
  } catch (error) {
    console.error('[services:create]', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
}

export async function updateService(req: Request, res: Response): Promise<void> {
  const parsed = updateServiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const id = String(req.params.id);
    const existing = await prisma.service.findUnique({
      where: { id },
      select: { id: true, duration: true, bufferBefore: true, bufferAfter: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const service = await prisma.service.update({
      where: { id },
      data: parsed.data,
    });

    const changed =
      (parsed.data.duration !== undefined && parsed.data.duration !== existing.duration) ||
      (parsed.data.bufferBefore !== undefined && parsed.data.bufferBefore !== existing.bufferBefore) ||
      (parsed.data.bufferAfter !== undefined && parsed.data.bufferAfter !== existing.bufferAfter);

    if (changed) {
      const ctx = getTenantContext();
      if (ctx.tenantId) {
        invalidateOnStaffAvailabilityChange(ctx.tenantId).catch(err =>
          console.error('[services:cache-invalidation-failed]', err),
        );
      }
    }

    res.json({ data: service });
  } catch (error) {
    console.error('[services:update]', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
}

export async function toggleServiceActive(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const service = await prisma.service.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const updated = await prisma.service.update({
      where: { id },
      data: { isActive: !service.isActive },
    });

    const ctx = getTenantContext();
    if (ctx.tenantId) {
      invalidateOnStaffAvailabilityChange(ctx.tenantId).catch(err =>
        console.error('[services:cache-invalidation-failed]', err),
      );
    }

    res.json({ data: updated });
  } catch (error) {
    console.error('[services:toggle]', error);
    res.status(500).json({ error: 'Failed to toggle service' });
  }
}

export async function listAllServices(_req: Request, res: Response): Promise<void> {
  try {
    const services = await prisma.$withBypass().service.findMany({
      include: { business: { select: { id: true, name: true, slug: true } } },
    });

    res.json({ data: services });
  } catch (error) {
    console.error('[services:admin-all]', error);
    res.status(500).json({ error: 'Failed to fetch all services' });
  }
}
