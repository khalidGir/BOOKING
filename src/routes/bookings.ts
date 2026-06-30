import { Router } from 'express';
import { requireRoles } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { reserveSlotSchema, confirmBookingSchema } from '../validations/booking.validation.js';
import {
  handleReserve,
  handleConfirm,
  handleRelease,
  handleCancel,
} from '../controllers/bookings.js';

const router = Router();

router.post('/reserve', requireRoles('BUSINESS_ADMIN', 'STAFF'), validate(reserveSlotSchema), handleReserve);
router.post('/confirm', requireRoles('BUSINESS_ADMIN', 'STAFF'), validate(confirmBookingSchema), handleConfirm);
router.post('/release', requireRoles('BUSINESS_ADMIN', 'STAFF'), handleRelease);
router.post('/:bookingId/cancel', requireRoles('BUSINESS_ADMIN', 'STAFF'), handleCancel);

export { router as bookingsRouter };
