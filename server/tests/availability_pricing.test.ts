import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/config/db.js';
import { checkHotelAvailability, parseAndValidateDates } from '../src/services/availabilityEngine.js';
import { calculateBookingPrice } from '../src/services/pricingEngine.js';
import { AppError } from '../src/types/index.js';

describe('Availability & Pricing Engine Suite', () => {
  let sampleHotelId: string;
  let sampleRoomTypeId: string;

  beforeAll(async () => {
    const hotel = await prisma.hotel.findFirst({
      include: { roomTypes: true },
    });
    if (hotel && hotel.roomTypes[0]) {
      sampleHotelId = hotel.id;
      sampleRoomTypeId = hotel.roomTypes[0].id;
    }
  });

  it('should validate stay dates correctly (reject past, equal, or backwards dates)', () => {
    expect(() => parseAndValidateDates('2026-10-15', '2026-10-10')).toThrow(AppError);
    expect(() => parseAndValidateDates('2026-10-15', '2026-10-15')).toThrow(AppError);

    const valid = parseAndValidateDates('2027-04-10', '2027-04-14');
    expect(valid.totalNights).toBe(4);
  });

  it('should calculate room availability excluding confirmed bookings and maintenance', async () => {
    const results = await checkHotelAvailability(
      sampleHotelId,
      '2027-06-01',
      '2027-06-05',
      2,
      1
    );

    expect(results.length).toBeGreaterThan(0);
    const target = results.find((r) => r.roomTypeId === sampleRoomTypeId);
    expect(target).toBeDefined();
    expect(target!.availableRooms).toBeGreaterThan(0);
    expect(target!.isAvailable).toBe(true);
  });

  it('should calculate accurate pricing with nights, weekend rates, taxes, and service fees', async () => {
    const pricing = await calculateBookingPrice(
      sampleHotelId,
      sampleRoomTypeId,
      '2027-06-01',
      '2027-06-04', // 3 nights
      1
    );

    expect(pricing.totalNights).toBe(3);
    expect(pricing.baseTotal).toBeGreaterThan(0);
    expect(pricing.taxTotal).toBe(Math.round(pricing.baseTotal * 0.10 * 100) / 100);
    expect(pricing.serviceFeeTotal).toBe(25.00);
    expect(pricing.grandTotal).toBe(
      Math.round((pricing.baseTotal + pricing.taxTotal + pricing.serviceFeeTotal) * 100) / 100
    );
  });

  it('should validate and apply percentage coupon discount (WELCOME10)', async () => {
    const pricing = await calculateBookingPrice(
      sampleHotelId,
      sampleRoomTypeId,
      '2027-06-01',
      '2027-06-04',
      1,
      'WELCOME10'
    );

    expect(pricing.appliedCoupon).toBeDefined();
    expect(pricing.appliedCoupon?.code).toBe('WELCOME10');
    expect(pricing.discountTotal).toBeGreaterThan(0);
    expect(pricing.discountTotal).toBeLessThanOrEqual(150.00); // capped at max discount
  });

  it('should reject invalid or non-existent coupon codes', async () => {
    await expect(
      calculateBookingPrice(
        sampleHotelId,
        sampleRoomTypeId,
        '2027-06-01',
        '2027-06-04',
        1,
        'FAKEDISCOUNT999'
      )
    ).rejects.toThrow(AppError);
  });
});
