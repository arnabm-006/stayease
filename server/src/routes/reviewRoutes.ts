import { Router } from 'express';
import { createReview, getHotelReviews } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticate, createReview);
router.get('/hotel/:hotelId', getHotelReviews);

export default router;
