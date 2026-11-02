import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getFavorites,
  toggleFavorite,
  getNotifications,
  markNotificationRead,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { updateProfileSchema, changePasswordSchema } from '../validators/authValidators.js';

const router = Router();

router.get('/me', authenticate, getProfile);
router.patch('/me', authenticate, validate(updateProfileSchema), updateProfile);
router.patch('/me/password', authenticate, validate(changePasswordSchema), changePassword);
router.get('/favorites', authenticate, getFavorites);
router.post('/favorites/:hotelId', authenticate, toggleFavorite);
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationRead);

export default router;
