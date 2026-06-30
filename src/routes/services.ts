import { Router } from 'express';
import { prisma } from '../utils/prisma.js';

const router = Router();

// ── Tenant-Isolated Query (businessId auto-injected) ─────────────
// The Prisma extension reads tenantId from AsyncLocalStorage
// and appends where: { businessId: <tenantId> } automatically.
// The caller does NOT specify businessId in the query.

router.get('/', async (_req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ data: services });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: { customFields: true, category: true },
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json({ data: service });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// ── Super Admin Bypass ───────────────────────────────────────────
// prisma.$withBypass() returns the raw, un-extended PrismaClient.
// All queries run without the automatic businessId filter.
// This must only be used by SUPER_ADMIN role (checked at route level).

router.get('/admin/all', async (req, res) => {
  const role = (req as any).role;
  if (role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Forbidden: Super Admin only' });
    return;
  }

  try {
    const allServices = await prisma.$withBypass().service.findMany({
      include: { business: { select: { id: true, name: true, slug: true } } },
    });

    res.json({ data: allServices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all services' });
  }
});

// ── Tenant-Scoped Create (businessId auto-assigned) ──────────────

router.post('/', async (req, res) => {
  try {
    const service = await prisma.service.create({
      data: {
        businessId: '',
        name: req.body.name,
        duration: req.body.duration,
        price: req.body.price,
        description: req.body.description,
        categoryId: req.body.categoryId,
      } as any,
    });

    res.status(201).json({ data: service });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

export { router as servicesRouter };
