import { Router } from 'express';
import { getBusinessServices, getAvailableSlots } from '../controllers/public.controller.js';

const router = Router();

router.get('/businesses/:slug/services', getBusinessServices);
router.get('/businesses/:slug/slots', getAvailableSlots);

export { router as publicRouter };
