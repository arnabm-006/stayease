import { Router } from 'express';
import {
  searchHotels,
  getFeaturedHotels,
  getPopularDestinations,
  getHotelDetails,
  getHotelRooms,
  getHotelAvailability,
} from '../controllers/hotelController.js';
import { validate } from '../middleware/validateMiddleware.js';
import { hotelSearchSchema } from '../validators/hotelValidators.js';

const router = Router();

router.get('/', validate(hotelSearchSchema), searchHotels);
router.get('/featured', getFeaturedHotels);
router.get('/destinations', getPopularDestinations);
router.get('/:id', getHotelDetails);
router.get('/:id/rooms', getHotelRooms);
router.get('/:id/availability', getHotelAvailability);

export default router;
