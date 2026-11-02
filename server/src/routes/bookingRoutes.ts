import { Router } from 'express';
import {
  createHold,
  calculatePrice,
  getMyBookings,
  getBookingById,
  cancelMyBooking,
} from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  createBookingHoldSchema,
  calculatePriceSchema,
  cancelBookingSchema,
} from '../validators/bookingValidators.js';

const router = Router();

router.post('/price', validate(calculatePriceSchema), calculatePrice);
router.post('/', authenticate, validate(createBookingHoldSchema), createHold);
router.get('/my', authenticate, getMyBookings);
router.get('/:id', authenticate, getBookingById);
router.post('/:id/cancel', authenticate, validate(cancelBookingSchema), cancelMyBooking);

export default router;
