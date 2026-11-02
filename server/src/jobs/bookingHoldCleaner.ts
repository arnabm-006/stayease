import { prisma } from '../config/db.js';
import { BookingStatus } from '@prisma/client';
import { logger } from '../utils/logger.js';

export async function cleanupExpiredBookingHolds(): Promise<number> {
  const now = new Date();

  try {
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        holdExpiresAt: { lt: now },
      },
      select: { id: true, bookingReference: true },
    });

    if (expiredBookings.length === 0) {
      return 0;
    }

    const result = await prisma.booking.updateMany({
      where: {
        id: { in: expiredBookings.map((b) => b.id) },
        status: BookingStatus.PENDING,
      },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: 'Booking hold expired before payment was completed.',
        cancelledAt: now,
      },
    });

    logger.info(`[BookingHoldCleaner] Released ${result.count} expired booking holds.`);
    return result.count;
  } catch (err: any) {
    logger.error('[BookingHoldCleaner] Failed to clean up expired holds:', err?.message || err);
    return 0;
  }
}

export function startBookingHoldCleanerJob(intervalMs: number = 60000): NodeJS.Timeout {
  logger.info('[BookingHoldCleaner] Background job scheduled every 60s.');
  return setInterval(() => {
    cleanupExpiredBookingHolds().catch(() => {});
  }, intervalMs);
}
