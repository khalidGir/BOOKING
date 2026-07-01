import { Router } from 'express';
import { requireRoles } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  createStaffSchema, updateStaffSchema,
  createAvailabilitySchema, updateAvailabilitySchema,
  createOverrideSchema, updateOverrideSchema,
} from '../validations/staff.validation.js';
import { createLocationSchema, updateLocationSchema, updateBusinessSchema } from '../validations/location.validation.js';
import {
  listStaff, getStaff, createStaff, updateStaff, toggleStaffActive,
  createAvailability, updateAvailability, deleteAvailability,
  createOverride, updateOverride, deleteOverride,
} from '../controllers/staff.controller.js';
import {
  listLocations, getLocation, createLocation, updateLocation, deleteLocation,
  getBusinessSettings, updateBusinessSettings,
  listCategories, createCategory, updateCategory, deleteCategory,
} from '../controllers/location.controller.js';

const router = Router();

// ── Staff ───────────────────────────────────────────────────────────
router.get('/staff', requireRoles('BUSINESS_ADMIN', 'STAFF'), listStaff);
router.get('/staff/:id', requireRoles('BUSINESS_ADMIN', 'STAFF'), getStaff);
router.post('/staff', requireRoles('BUSINESS_ADMIN'), validate(createStaffSchema), createStaff);
router.patch('/staff/:id', requireRoles('BUSINESS_ADMIN'), validate(updateStaffSchema), updateStaff);
router.post('/staff/:id/toggle', requireRoles('BUSINESS_ADMIN'), toggleStaffActive);

// ── Staff Availability ───────────────────────────────────────────────
router.post('/staff-availability', requireRoles('BUSINESS_ADMIN'), validate(createAvailabilitySchema), createAvailability);
router.patch('/staff-availability/:id', requireRoles('BUSINESS_ADMIN'), validate(updateAvailabilitySchema), updateAvailability);
router.delete('/staff-availability/:id', requireRoles('BUSINESS_ADMIN'), deleteAvailability);

// ── Staff Availability Override ──────────────────────────────────────
router.post('/staff-override', requireRoles('BUSINESS_ADMIN'), validate(createOverrideSchema), createOverride);
router.patch('/staff-override/:id', requireRoles('BUSINESS_ADMIN'), validate(updateOverrideSchema), updateOverride);
router.delete('/staff-override/:id', requireRoles('BUSINESS_ADMIN'), deleteOverride);

// ── Locations ────────────────────────────────────────────────────────
router.get('/locations', requireRoles('BUSINESS_ADMIN', 'STAFF'), listLocations);
router.get('/locations/:id', requireRoles('BUSINESS_ADMIN', 'STAFF'), getLocation);
router.post('/locations', requireRoles('BUSINESS_ADMIN'), validate(createLocationSchema), createLocation);
router.patch('/locations/:id', requireRoles('BUSINESS_ADMIN'), validate(updateLocationSchema), updateLocation);
router.delete('/locations/:id', requireRoles('BUSINESS_ADMIN'), deleteLocation);

// ── Categories ───────────────────────────────────────────────────────
router.get('/categories', requireRoles('BUSINESS_ADMIN', 'STAFF'), listCategories);
router.post('/categories', requireRoles('BUSINESS_ADMIN'), createCategory);
router.patch('/categories/:id', requireRoles('BUSINESS_ADMIN'), updateCategory);
router.delete('/categories/:id', requireRoles('BUSINESS_ADMIN'), deleteCategory);

// ── Business Settings ────────────────────────────────────────────────
router.get('/business', requireRoles('BUSINESS_ADMIN'), getBusinessSettings);
router.patch('/business', requireRoles('BUSINESS_ADMIN'), validate(updateBusinessSchema), updateBusinessSettings);

export { router as adminRouter };
