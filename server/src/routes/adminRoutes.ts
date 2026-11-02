import { Router } from 'express';
import {
  getDashboardMetrics,
  getAdminHotels,
  createAdminHotel,
  updateAdminHotel,
  deleteAdminHotel,
  getAdminRooms,
  createAdminRoom,
  updateAdminRoom,
  createAdminRoomType,
  getAdminBookings,
  updateBookingStatus,
  getHousekeepingRooms,
  updateRoomCleaningStatus,
  getMaintenanceList,
  scheduleMaintenance,
  updateMaintenanceStatus,
  getAdminCoupons,
  createAdminCoupon,
  getAdminUsers,
  createStaffMember,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Require Staff / Manager / Admin authentication on all routes below
router.use(authenticate);
router.use(authorizeRoles(Role.RECEPTIONIST, Role.HOTEL_MANAGER, Role.SUPER_ADMIN));

// Overview Metrics
router.get('/dashboard', getDashboardMetrics);

// Hotel Management
router.get('/hotels', getAdminHotels);
router.post('/hotels', authorizeRoles(Role.SUPER_ADMIN), createAdminHotel);
router.patch('/hotels/:id', authorizeRoles(Role.HOTEL_MANAGER, Role.SUPER_ADMIN), updateAdminHotel);
router.delete('/hotels/:id', authorizeRoles(Role.SUPER_ADMIN), deleteAdminHotel);

// Rooms & Room Types
router.get('/rooms', getAdminRooms);
router.post('/rooms', authorizeRoles(Role.HOTEL_MANAGER, Role.SUPER_ADMIN), createAdminRoom);
router.patch('/rooms/:id', updateAdminRoom);
router.post('/room-types', authorizeRoles(Role.HOTEL_MANAGER, Role.SUPER_ADMIN), createAdminRoomType);

// Reservations & Reception
router.get('/bookings', getAdminBookings);
router.patch('/bookings/:id/status', updateBookingStatus);

// Housekeeping & Maintenance
router.get('/housekeeping', getHousekeepingRooms);
router.patch('/rooms/:id/cleaning', updateRoomCleaningStatus);
router.get('/maintenance', getMaintenanceList);
router.post('/maintenance', scheduleMaintenance);
router.patch('/maintenance/:id', updateMaintenanceStatus);

// Coupons
router.get('/coupons', getAdminCoupons);
router.post('/coupons', authorizeRoles(Role.HOTEL_MANAGER, Role.SUPER_ADMIN), createAdminCoupon);

// Staff Management (Super Admin only)
router.get('/users', authorizeRoles(Role.SUPER_ADMIN), getAdminUsers);
router.post('/staff', authorizeRoles(Role.SUPER_ADMIN), createStaffMember);

export default router;
