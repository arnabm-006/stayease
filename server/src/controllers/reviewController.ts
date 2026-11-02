import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AuthenticatedRequest, AppError } from '../types/index.js';
import { BookingStatus } from '@prisma/client';

export async function createReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);

    const {
      hotelId,
      bookingId,
      rating,
      title,
      comment,
      staffRating = 5,
      cleanlinessRating = 5,
      comfortRating = 5,
      locationRating = 5,
    } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw new AppError('Overall rating must be between 1 and 5 stars.', 400);
    }

    if (!title || !comment) {
      throw new AppError('Review title and comment are required.', 400);
    }

    // Backend verification: Customer eligibility check
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new AppError('Associated booking record not found.', 404);
    }

    if (booking.customerId !== req.user.id) {
      throw new AppError('Access denied: You can only review stays booked from your account.', 403);
    }

    if (booking.hotelId !== hotelId) {
      throw new AppError('Booking does not match this hotel.', 400);
    }

    // Must be a completed stay (CHECKED_OUT)
    if (booking.status !== BookingStatus.CHECKED_OUT) {
      throw new AppError(
        'Review eligibility requires a completed stay (status must be Checked-Out).',
        400
      );
    }

    // Prevent duplicate reviews for the same booking
    const existing = await prisma.review.findUnique({
      where: { bookingId },
    });

    if (existing) {
      throw new AppError('You have already submitted a verified review for this stay.', 400);
    }

    const review = await prisma.review.create({
      data: {
        hotelId,
        bookingId,
        userId: req.user.id,
        rating,
        title,
        comment,
        staffRating,
        cleanlinessRating,
        comfortRating,
        locationRating,
        isApproved: true,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your verified review!',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
}

export async function getHotelReviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { hotelId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { hotelId, isApproved: true },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { reviews } });
  } catch (error) {
    next(error);
  }
}
