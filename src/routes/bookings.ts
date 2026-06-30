import { Router } from 'express';
import { handleReserve, handleConfirm, handleRelease } from '../controllers/bookings.js';

const router = Router();

router.post('/reserve', handleReserve);
router.post('/confirm', handleConfirm);
router.post('/release', handleRelease);

export { router as bookingsRouter };
