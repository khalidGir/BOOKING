import { Router } from 'express';
import { handleReserve, handleConfirm, handleRelease, handleCancel } from '../controllers/bookings.js';

const router = Router();

router.post('/reserve', handleReserve);
router.post('/confirm', handleConfirm);
router.post('/release', handleRelease);
router.post('/:bookingId/cancel', handleCancel);

export { router as bookingsRouter };
