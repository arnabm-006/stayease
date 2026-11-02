import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AuthenticatedRequest, AppError } from '../types/index.js';
import { createBookingHold, cancelBooking } from '../services/bookingService.js';
import { calculateBookingPrice } from '../services/pricingEngine.js';
import { Role } from '@prisma/client';

export async function createHold(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const {
      hotelId,
      roomTypeId,
      checkInDate,
      checkOutDate,
      roomQuantity = 1,
      numAdults = 1,
      numChildren = 0,
      couponCode,
      specialRequests,
      guests,
    } = req.body;

    const result = await createBookingHold({
      customerId: req.user.id,
      hotelId,
      roomTypeId,
      checkInDate,
      checkOutDate,
      roomQuantity,
      numAdults,
      numChildren,
      couponCode,
      specialRequests,
      guests,
    });

    res.status(201).json({
      success: true,
      message: 'Temporary reservation hold created. Please complete payment within 15 minutes.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function calculatePrice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { hotelId, roomTypeId, checkInDate, checkOutDate, roomQuantity = 1, couponCode } = req.body;

    const pricing = await calculateBookingPrice(
      hotelId,
      roomTypeId,
      checkInDate,
      checkOutDate,
      roomQuantity,
      couponCode
    );

    res.json({
      success: true,
      data: { pricing },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const bookings = await prisma.booking.findMany({
      where: { customerId: req.user.id },
      include: {
        hotel: {
          include: {
            images: { where: { isCover: true }, take: 1 },
          },
        },
        bookingRooms: { include: { roomType: true, room: true } },
        payments: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
}

export async function getBookingById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { bookingReference: id }],
      },
      include: {
        hotel: {
          include: {
            images: { orderBy: { order: 'asc' } },
            amenities: { include: { amenity: true } },
          },
        },
        bookingRooms: { include: { roomType: true, room: true } },
        guests: true,
        payments: { include: { refunds: true } },
        bookingCoupons: { include: { coupon: true } },
        review: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    // Role-based customer isolation
    if (req.user.role === Role.CUSTOMER && booking.customerId !== req.user.id) {
      throw new AppError('Access denied: You can only view your own bookings.', 403);
    }

    // Staff isolation
    if (
      (req.user.role === Role.HOTEL_MANAGER || req.user.role === Role.RECEPTIONIST) &&
      req.user.hotelId &&
      booking.hotelId !== req.user.hotelId
    ) {
      throw new AppError('Access denied: You are not authorized to view bookings for other hotels.', 403);
    }

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelMyBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;
    const { cancellationReason } = req.body;

    const result = await cancelBooking(id, req.user.id, req.user.role, cancellationReason);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
