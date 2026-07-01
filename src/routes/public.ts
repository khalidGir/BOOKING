import { Router } from 'express';
import { getBusinessServices, getAvailableSlots, createPublicBooking } from '../controllers/public.controller.js';
import { getBookingByToken, cancelBookingByToken } from '../controllers/customer-management.controller.js';
import { widgetGuard } from '../middleware/widget-guard.js';

const router = Router();

router.get('/businesses/:slug/services', widgetGuard('slug'), getBusinessServices);
router.get('/businesses/:slug/slots', widgetGuard('slug'), getAvailableSlots);
router.post('/businesses/:slug/book', widgetGuard('slug'), createPublicBooking);

router.get('/bookings/manage/:token', getBookingByToken);
router.post('/bookings/manage/:token/cancel', cancelBookingByToken);

export { router as publicRouter };
