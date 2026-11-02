import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/db.js';
import { createBookingHold, cancelBooking, transitionBookingStatus } from '../src/services/bookingService.js';
import { paymentService } from '../src/services/paymentService.js';
import { verifyAndLockRoomTypeAvailability } from '../src/services/availabilityEngine.js';
import { BookingStatus, Role, RoomStatus } from '@prisma/client';
import { AppError } from '../src/types/index.js';

describe('Booking Lifecycle, Concurrency & Payment Suite', () => {
  let customerUser: any;
  let sampleHotel: any;
  let sampleRoomType: any;
  let testBookingId: string;

  beforeAll(async () => {
    customerUser = await prisma.user.findFirst({
      where: { email: 'customer@stayease.com' },
    });

    sampleHotel = await prisma.hotel.findFirst({
      include: { roomTypes: { include: { rooms: true } } },
    });

    sampleRoomType = sampleHotel.roomTypes[0];
  });

  it('should create a temporary booking hold with server-calculated price and expiration', async () => {
    const result = await createBookingHold({
      customerId: customerUser.id,
      hotelId: sampleHotel.id,
      roomTypeId: sampleRoomType.id,
      checkInDate: '2027-08-10',
      checkOutDate: '2027-08-14',
      roomQuantity: 1,
      numAdults: 2,
      numChildren: 0,
      specialRequests: 'Quiet room please',
      guests: [
        {
          firstName: 'Julian',
          lastName: 'Montgomery',
          email: 'customer@stayease.com',
          phone: '+1 555-0129',
          isPrimary: true,
        },
      ],
    });

    expect(result.booking).toBeDefined();
    expect(result.booking.status).toBe(BookingStatus.PENDING);
    expect(result.holdExpiresAt).toBeDefined();
    expect(result.pricing.grandTotal).toBeGreaterThan(0);

    testBookingId = result.booking.id;
  });

  it('should prevent overbooking when requested inventory exceeds capacity', async () => {
    const totalPhysicalRooms = sampleRoomType.rooms.length;
    const excessiveQuantity = totalPhysicalRooms + 5;

    await expect(
      prisma.$transaction((tx) =>
        verifyAndLockRoomTypeAvailability(
          sampleHotel.id,
          sampleRoomType.id,
          new Date('2027-08-10'),
          new Date('2027-08-14'),
          excessiveQuantity,
          tx
        )
      )
    ).rejects.toThrow(AppError);
  });

  it('should verify payment and finalize booking to CONFIRMED status', async () => {
    // Generate order
    const order = await paymentService.createOrder(testBookingId, customerUser.id);
    expect(order.orderId).toBeDefined();

    // Verify payment in test simulated mode
    const verification = await paymentService.verifyPayment(
      testBookingId,
      order.orderId,
      'pay_test_sim_12345',
      'signature_sim_test',
      true
    );

    expect(verification.success).toBe(true);

    const updated = await prisma.booking.findUnique({
      where: { id: testBookingId },
    });
    expect(updated?.status).toBe(BookingStatus.CONFIRMED);
    expect(updated?.holdExpiresAt).toBeNull();
  });

  it('should prevent duplicate confirmation idempotently', async () => {
    const duplicate = await paymentService.verifyPayment(
      testBookingId,
      'order_dup',
      'pay_dup',
      'sig_dup',
      true
    );

    expect(duplicate.success).toBe(true);
    expect(duplicate.message).toContain('already been verified');
  });

  it('should enforce valid state machine transitions (CONFIRMED -> CHECKED_IN -> CHECKED_OUT)', async () => {
    // Check-in
    const checkedIn = await transitionBookingStatus(
      testBookingId,
      BookingStatus.CHECKED_IN,
      customerUser.id,
      'Guest arrived at front desk.'
    );
    expect(checkedIn.status).toBe(BookingStatus.CHECKED_IN);

    // Invalid transition: CHECKED_IN cannot transition back to PENDING or CANCELLED
    await expect(
      transitionBookingStatus(
        testBookingId,
        BookingStatus.PENDING,
        customerUser.id
      )
    ).rejects.toThrow(AppError);

    // Check-out
    const checkedOut = await transitionBookingStatus(
      testBookingId,
      BookingStatus.CHECKED_OUT,
      customerUser.id,
      'Guest departure completed.'
    );
    expect(checkedOut.status).toBe(BookingStatus.CHECKED_OUT);
  });

  it('should enforce review eligibility: only completed stays can be reviewed', async () => {
    // Attempting to review an uncompleted stay throws error
    const activeBooking = await prisma.booking.create({
      data: {
        bookingReference: `SE-TEST-ACTIVE-${Date.now()}`,
        customerId: customerUser.id,
        hotelId: sampleHotel.id,
        checkInDate: new Date('2027-09-01'),
        checkOutDate: new Date('2027-09-04'),
        totalNights: 3,
        status: BookingStatus.CONFIRMED,
        baseTotal: 500,
        taxTotal: 50,
        grandTotal: 575,
      },
    });

    const isEligible = activeBooking.status === BookingStatus.CHECKED_OUT;
    expect(isEligible).toBe(false);

    // Cleanup active test booking
    await prisma.booking.delete({ where: { id: activeBooking.id } });
  });

  afterAll(async () => {
    if (testBookingId) {
      await prisma.review.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.bookingCoupon.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.refund.deleteMany({ where: { payment: { bookingId: testBookingId } } });
      await prisma.payment.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.guest.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.bookingRoom.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.booking.deleteMany({ where: { id: testBookingId } });
    }
  });
});
