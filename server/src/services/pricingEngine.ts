import { prisma } from '../config/db.js';
import { AppError } from '../types/index.js';
import { DiscountType, Prisma } from '@prisma/client';
import { parseAndValidateDates } from './availabilityEngine.js';

export interface PricingBreakdown {
  nightlyRate: number;
  totalNights: number;
  roomQuantity: number;
  baseTotal: number;
  discountTotal: number;
  taxTotal: number;
  serviceFeeTotal: number;
  grandTotal: number;
  currency: string;
  appliedCoupon?: {
    id: string;
    code: string;
    description: string;
    discountValue: number;
    discountType: DiscountType;
  } | null;
}

export async function calculateBookingPrice(
  hotelId: string,
  roomTypeId: string,
  checkInStr: string,
  checkOutStr: string,
  roomQuantity: number = 1,
  couponCode?: string,
  tx: Prisma.TransactionClient = prisma
): Promise<PricingBreakdown> {
  const { totalNights, checkInDate, checkOutDate } = parseAndValidateDates(checkInStr, checkOutStr);

  const roomType = await tx.roomType.findUnique({
    where: { id: roomTypeId },
    include: {
      roomRates: {
        where: {
          startDate: { lte: checkOutDate },
          endDate: { gte: checkInDate },
        },
      },
    },
  });

  if (!roomType || roomType.hotelId !== hotelId) {
    throw new AppError('Room type not found for the selected hotel.', 404);
  }

  const basePricePerNight = Number(roomType.basePrice);
  
  // Calculate nightly rate with any active seasonal or date-specific rates
  let totalRoomCostForOneRoom = 0;
  const curDate = new Date(checkInDate);

  for (let i = 0; i < totalNights; i++) {
    const isWeekend = curDate.getUTCDay() === 5 || curDate.getUTCDay() === 6; // Friday / Saturday
    const matchingRate = roomType.roomRates.find(
      (r) => curDate >= r.startDate && curDate < r.endDate
    );

    let nightlyCost = basePricePerNight;
    if (matchingRate) {
      nightlyCost = Number(matchingRate.nightlyRate);
    } else if (isWeekend) {
      // Standard 10% weekend surcharge if no specific weekend rate override exists
      nightlyCost = Math.round(basePricePerNight * 1.10 * 100) / 100;
    }

    totalRoomCostForOneRoom += nightlyCost;
    curDate.setUTCDate(curDate.getUTCDate() + 1);
  }

  const baseTotal = Math.round(totalRoomCostForOneRoom * roomQuantity * 100) / 100;
  const effectiveAverageNightlyRate = Math.round((baseTotal / (totalNights * roomQuantity)) * 100) / 100;

  // Validate and calculate coupon discount
  let discountTotal = 0;
  let appliedCoupon = null;

  if (couponCode && couponCode.trim()) {
    const normalizedCode = couponCode.trim().toUpperCase();
    const now = new Date();

    const coupon = await tx.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon || !coupon.isActive) {
      throw new AppError(`Coupon code "${normalizedCode}" is invalid or expired.`, 400);
    }

    if (now < coupon.startDate || now > coupon.endDate) {
      throw new AppError(`Coupon code "${normalizedCode}" is not valid for current dates.`, 400);
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new AppError(`Coupon code "${normalizedCode}" has reached its maximum usage limit.`, 400);
    }

    const minSpend = Number(coupon.minBookingAmount);
    if (baseTotal < minSpend) {
      throw new AppError(
        `Coupon code "${normalizedCode}" requires a minimum booking amount of $${minSpend.toFixed(2)}.`,
        400
      );
    }

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      const percentDiscount = (baseTotal * Number(coupon.discountValue)) / 100;
      const maxDiscount = coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : Infinity;
      discountTotal = Math.min(percentDiscount, maxDiscount);
    } else {
      discountTotal = Math.min(Number(coupon.discountValue), baseTotal);
    }

    discountTotal = Math.round(discountTotal * 100) / 100;

    appliedCoupon = {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountValue: Number(coupon.discountValue),
      discountType: coupon.discountType,
    };
  }

  const subtotalAfterDiscount = Math.max(0, baseTotal - discountTotal);
  
  // Taxes: 10% luxury accommodation tax
  const taxTotal = Math.round(subtotalAfterDiscount * 0.10 * 100) / 100;
  
  // Standard luxury hospitality & resort service fee ($25.00 flat per stay)
  const serviceFeeTotal = 25.00;

  const grandTotal = Math.round((subtotalAfterDiscount + taxTotal + serviceFeeTotal) * 100) / 100;

  return {
    nightlyRate: effectiveAverageNightlyRate,
    totalNights,
    roomQuantity,
    baseTotal,
    discountTotal,
    taxTotal,
    serviceFeeTotal,
    grandTotal,
    currency: 'USD',
    appliedCoupon,
  };
}
