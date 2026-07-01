import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { getTenantContext } from '../middleware/tenant-context.js';

export async function listLocations(_req: Request, res: Response): Promise<void> {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({ data: locations });
  } catch (error) {
    console.error('[location:list]', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
}

export async function getLocation(req: Request, res: Response): Promise<void> {
  try {
    const location = await prisma.location.findUnique({
      where: { id: String(req.params.id) },
      include: {
        services: { include: { service: { select: { id: true, name: true } } } },
      },
    });

    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    res.json({ data: location });
  } catch (error) {
    console.error('[location:get]', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
}

export async function createLocation(req: Request, res: Response): Promise<void> {
  const { serviceIds, ...data } = req.body;

  try {
    const location = await prisma.location.create({
      data: {
        ...data,
        ...(serviceIds ? {
          services: {
            create: serviceIds.map((serviceId: string) => ({ serviceId })),
          },
        } : {}),
      },
    });

    res.status(201).json({ data: location });
  } catch (error) {
    console.error('[location:create]', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
}

export async function updateLocation(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { serviceIds, ...data } = req.body;

  try {
    const existing = await prisma.location.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    const location = await prisma.location.update({
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

    res.json({ data: location });
  } catch (error) {
    console.error('[location:update]', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
}

export async function deleteLocation(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const existing = await prisma.location.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    await prisma.location.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ data: { id, deleted: true } });
  } catch (error) {
    console.error('[location:delete]', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
}

export async function getBusinessSettings(_req: Request, res: Response): Promise<void> {
  try {
    const ctx = getTenantContext();
    const business = await prisma.business.findUnique({
      where: { id: ctx.tenantId ?? undefined },
    });

    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    res.json({ data: business });
  } catch (error) {
    console.error('[business:settings]', error);
    res.status(500).json({ error: 'Failed to fetch business settings' });
  }
}

export async function updateBusinessSettings(req: Request, res: Response): Promise<void> {
  try {
    const ctx = getTenantContext();
    const business = await prisma.business.update({
      where: { id: ctx.tenantId ?? undefined },
      data: req.body,
    });

    res.json({ data: business });
  } catch (error) {
    console.error('[business:settings:update]', error);
    res.status(500).json({ error: 'Failed to update business settings' });
  }
}

export async function listCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { services: true } } },
    });

    res.json({ data: categories });
  } catch (error) {
    console.error('[category:list]', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const ctx = getTenantContext();
    const category = await prisma.serviceCategory.create({
      data: {
        name: String(req.body.name),
        description: req.body.description ?? null,
        sortOrder: req.body.sortOrder ?? 0,
      } as any,
    });

    res.status(201).json({ data: category });
  } catch (error) {
    console.error('[category:create]', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const category = await prisma.serviceCategory.update({
      where: { id },
      data: req.body,
    });

    res.json({ data: category });
  } catch (error) {
    console.error('[category:update]', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    await prisma.serviceCategory.delete({ where: { id } });
    res.json({ data: { id, deleted: true } });
  } catch (error: any) {
    console.error('[category:delete]', error);
    if (error?.code === 'P2003') {
      res.status(400).json({ error: 'Cannot delete category with existing services. Remove services first.' });
      return;
    }
    res.status(500).json({ error: 'Failed to delete category' });
  }
}
