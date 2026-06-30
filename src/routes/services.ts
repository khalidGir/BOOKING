import { Router } from 'express';
import { requireRoles } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createServiceSchema, updateServiceSchema } from '../validations/service.validation.js';
import {
  listServices,
  getService,
  createService,
  updateService,
  toggleServiceActive,
  listAllServices,
} from '../controllers/service.controller.js';

const router = Router();

router.get('/admin/all', requireRoles('SUPER_ADMIN'), listAllServices);

router.get('/', requireRoles('BUSINESS_ADMIN', 'STAFF'), listServices);
router.get('/:id', requireRoles('BUSINESS_ADMIN', 'STAFF'), getService);
router.post('/', requireRoles('BUSINESS_ADMIN'), validate(createServiceSchema), createService);
router.patch('/:id', requireRoles('BUSINESS_ADMIN'), validate(updateServiceSchema), updateService);
router.post('/:id/toggle', requireRoles('BUSINESS_ADMIN'), toggleServiceActive);

export { router as servicesRouter };
