import { prisma } from '../config/db.js';
import { AppError } from '../types/index.js';
import { BookingStatus, PaymentStatus, Role, RoomStatus } from '@prisma/client';
import { generateBookingReference } from '../utils/bookingReference.js';
import { parseAndValidateDates, verifyAndLockRoomTypeAvailability } from './availabilityEngine.js';
import { calculateBookingPrice } from './pricingEngine.js';
import { paymentService } from './paymentService.js';
import { emailService } from './emailService.js';
import { logger } from '../utils/logger.js';

export interface CreateBookingHoldParams {
  customerId: string;
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  roomQuantity: number;
  numAdults: number;
  numChildren: number;
  couponCode?: string;
  specialRequests?: string;
  guests: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    isPrimary?: boolean;
    identificationType?: string;
    identificationNumber?: string;
  }>;
}

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.CHECKED_IN, BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
  [BookingStatus.CHECKED_IN]: [BookingStatus.CHECKED_OUT],
  [BookingStatus.CHECKED_OUT]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.NO_SHOW]: [],
};

export async function createBookingHold(params: CreateBookingHoldParams) {
  const { checkInDate, checkOutDate, totalNights } = parseAndValidateDates(
    params.checkInDate,
    params.checkOutDate
  );

  return prisma.$transaction(async (tx) => {
    // 1. Concurrency safe check: verify available inventory
    await verifyAndLockRoomTypeAvailability(
      params.hotelId,
      params.roomTypeId,
      checkInDate,
      checkOutDate,
      params.roomQuantity,
      tx
    );

    // 2. Server calculates price breakdown
    const pricing = await calculateBookingPrice(
      params.hotelId,
      params.roomTypeId,
      params.checkInDate,
      params.checkOutDate,
      params.roomQuantity,
      params.couponCode,
      tx
    );

    // 3. Set temporary hold expiration (15 minutes from now)
    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const bookingReference = generateBookingReference();

    // 4. Create Booking record
    const booking = await tx.booking.create({
      data: {
        bookingReference,
        customerId: params.customerId,
        hotelId: params.hotelId,
        checkInDate,
        checkOutDate,
        numAdults: params.numAdults,
        numChildren: params.numChildren,
        totalNights,
        status: BookingStatus.PENDING,
        holdExpiresAt,
        baseTotal: pricing.baseTotal,
        discountTotal: pricing.discountTotal,
        taxTotal: pricing.taxTotal,
        serviceFeeTotal: pricing.serviceFeeTotal,
        grandTotal: pricing.grandTotal,
        currency: pricing.currency,
        specialRequests: params.specialRequests,
        guests: {
          create: params.guests.map((g, idx) => ({
            firstName: g.firstName,
            lastName: g.lastName,
            email: g.email,
            phone: g.phone,
            isPrimary: g.isPrimary ?? (idx === 0),
            identificationType: g.identificationType,
            identificationNumber: g.identificationNumber,
          })),
        },
        bookingRooms: {
          create: Array.from({ length: params.roomQuantity }).map(() => ({
            roomTypeId: params.roomTypeId,
            nightlyRateSnapshot: pricing.nightlyRate,
            guestName: `${params.guests[0].firstName} ${params.guests[0].lastName}`,
          })),
        },
      },
      include: {
        hotel: true,
        bookingRooms: { include: { roomType: true } },
        guests: true,
      },
    });

    // 5. If coupon applied, attach bookingCoupon record
    if (pricing.appliedCoupon) {
      await tx.bookingCoupon.create({
        data: {
          bookingId: booking.id,
          couponId: pricing.appliedCoupon.id,
          discountApplied: pricing.discountTotal,
        },
      });
    }

    return {
      booking,
      pricing,
      holdExpiresAt,
    };
  });
}

export async function cancelBooking(
  bookingId: string,
  userId: string,
  userRole: Role,
  cancellationReason: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      hotel: true,
      payments: true,
      guests: { where: { isPrimary: true } },
      customer: true,
    },
  });

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  // Authorization check: only customer who owns the booking or hotel staff/admin
  if (userRole === Role.CUSTOMER && booking.customerId !== userId) {
    throw new AppError('Access denied: You can only cancel your own reservations.', 403);
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw new AppError('This booking is already cancelled.', 400);
  }

  if (booking.status === BookingStatus.CHECKED_IN || booking.status === BookingStatus.CHECKED_OUT) {
    throw new AppError('Cannot cancel a stay that has already checked in or completed.', 400);
  }

  // Calculate cancellation refund eligibility
  // Hotel policy: free cancellation if >= 48 hours before check-in date
  const now = new Date();
  const checkInDate = new Date(booking.checkInDate);
  const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  let cancellationFee = 0;
  let refundAmount = 0;

  const successfulPayment = booking.payments.find((p) => p.status === PaymentStatus.SUCCESS);

  if (successfulPayment) {
    const paidTotal = Number(successfulPayment.amount);
    if (hoursUntilCheckIn < 48) {
      // 1-night cancellation fee if cancelled within 48 hours
      const oneNightCost = Number(booking.baseTotal) / booking.totalNights;
      cancellationFee = Math.min(paidTotal, Math.round(oneNightCost * 100) / 100);
      refundAmount = Math.max(0, paidTotal - cancellationFee);
    } else {
      // 100% full refund
      refundAmount = paidTotal;
      cancellationFee = 0;
    }
  }

  // Transactionally update booking and process refund
  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason,
        cancellationFee,
      },
    });

    if (successfulPayment && refundAmount > 0) {
      await paymentService.processRefund(
        successfulPayment.id,
        `Cancellation refund for ${booking.bookingReference}: ${cancellationReason}`,
        refundAmount
      );
    }

    // Release any allocated room back to AVAILABLE
    const bookingRooms = await tx.bookingRoom.findMany({
      where: { bookingId: booking.id, roomId: { not: null } },
    });

    for (const br of bookingRooms) {
      if (br.roomId) {
        await tx.room.update({
          where: { id: br.roomId },
          data: { status: RoomStatus.AVAILABLE },
        });
      }
    }
  });

  // Notify customer
  const guest = booking.guests[0] || {
    email: booking.customer.email,
    firstName: booking.customer.firstName,
  };

  emailService
    .sendCancellationConfirmation(
      guest.email,
      guest.firstName,
      booking.bookingReference,
      booking.hotel.name,
      refundAmount
    )
    .catch((err) => logger.error('[BookingService] Cancellation email failed:', err));

  return {
    success: true,
    bookingReference: booking.bookingReference,
    refundAmount,
    cancellationFee,
    message: 'Booking cancelled successfully.',
  };
}

export async function transitionBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  staffUserId: string,
  notes?: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      hotel: true,
      bookingRooms: true,
      payments: true,
    },
  });

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  const allowedNextStatuses = VALID_TRANSITIONS[booking.status];
  if (!allowedNextStatuses.includes(newStatus)) {
    throw new AppError(
      `Invalid status transition from ${booking.status} to ${newStatus}.`,
      400
    );
  }

  // Check-in validation: must have successful payment or paid status
  if (newStatus === BookingStatus.CHECKED_IN) {
    const hasSuccessfulPayment = booking.payments.some((p) => p.status === PaymentStatus.SUCCESS);
    if (!hasSuccessfulPayment) {
      throw new AppError('Cannot check-in an unpaid reservation. Payment must be confirmed first.', 400);
    }
  }

  return prisma.$transaction(async (tx) => {
    // If checking in, automatically allocate available physical rooms if not yet assigned
    if (newStatus === BookingStatus.CHECKED_IN) {
      for (const br of booking.bookingRooms) {
        if (!br.roomId) {
          const availableRoom = await tx.room.findFirst({
            where: {
              hotelId: booking.hotelId,
              roomTypeId: br.roomTypeId,
              status: RoomStatus.AVAILABLE,
            },
          });

          if (availableRoom) {
            await tx.bookingRoom.update({
              where: { id: br.id },
              data: { roomId: availableRoom.id, allocatedAt: new Date() },
            });
            await tx.room.update({
              where: { id: availableRoom.id },
              data: { status: RoomStatus.OCCUPIED },
            });
          }
        } else {
          await tx.room.update({
            where: { id: br.roomId },
            data: { status: RoomStatus.OCCUPIED },
          });
        }
      }
    }

    // If checking out, set room status to CLEANING for housekeeping workflow
    if (newStatus === BookingStatus.CHECKED_OUT) {
      for (const br of booking.bookingRooms) {
        if (br.roomId) {
          await tx.room.update({
            where: { id: br.roomId },
            data: { status: RoomStatus.CLEANING },
          });
        }
      }
    }

    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
      include: {
        hotel: true,
        bookingRooms: { include: { room: true, roomType: true } },
        guests: true,
        payments: true,
      },
    });

    // Record in Audit Log
    await tx.auditLog.create({
      data: {
        userId: staffUserId,
        hotelId: booking.hotelId,
        action: `BOOKING_STATUS_${newStatus}`,
        entity: 'Booking',
        entityId: booking.id,
        details: JSON.stringify({
          fromStatus: booking.status,
          toStatus: newStatus,
          reference: booking.bookingReference,
          notes,
        }),
      },
    });

    return updatedBooking;
  });
}
