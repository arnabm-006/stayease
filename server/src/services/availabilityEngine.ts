import { prisma } from '../config/db.js';
import { AppError } from '../types/index.js';
import { BookingStatus, RoomStatus, MaintenanceStatus, Prisma } from '@prisma/client';

export interface AvailabilityResult {
  roomTypeId: string;
  roomTypeName: string;
  description: string;
  basePrice: number;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  bedConfig: string;
  roomSizeSqFt: number;
  imageUrl: string | null;
  totalRooms: number;
  bookedRooms: number;
  maintenanceRooms: number;
  availableRooms: number;
  isAvailable: boolean;
}

export function parseAndValidateDates(checkInStr: string, checkOutStr: string): { checkInDate: Date; checkOutDate: Date; totalNights: number } {
  const checkInDate = new Date(checkInStr);
  const checkOutDate = new Date(checkOutStr);

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    throw new AppError('Invalid date format. Expected YYYY-MM-DD.', 400);
  }

  // Normalize to midnight UTC for clean date-only comparisons
  checkInDate.setUTCHours(0, 0, 0, 0);
  checkOutDate.setUTCHours(0, 0, 0, 0);

  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  if (checkInDate < now) {
    throw new AppError('Check-in date cannot be in the past.', 400);
  }

  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const totalNights = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (totalNights <= 0) {
    throw new AppError('Check-out date must be after check-in date (minimum 1 night).', 400);
  }

  if (totalNights > 30) {
    throw new AppError('Maximum stay duration is 30 consecutive nights.', 400);
  }

  return { checkInDate, checkOutDate, totalNights };
}

export async function checkHotelAvailability(
  hotelId: string,
  checkInStr: string,
  checkOutStr: string,
  guests: number = 1,
  requestedRooms: number = 1,
  tx: Prisma.TransactionClient = prisma
): Promise<AvailabilityResult[]> {
  const { checkInDate, checkOutDate } = parseAndValidateDates(checkInStr, checkOutStr);
  const now = new Date();

  // 1. Fetch all room types for this hotel
  const roomTypes = await tx.roomType.findMany({
    where: { hotelId },
    include: {
      rooms: true,
    },
  });

  if (!roomTypes.length) {
    return [];
  }

  // 2. Fetch all blocking bookings overlapping [checkInDate, checkOutDate)
  // Overlap condition: checkInDate < b.checkOutDate AND checkOutDate > b.checkInDate
  const blockingBookings = await tx.booking.findMany({
    where: {
      hotelId,
      checkInDate: { lt: checkOutDate },
      checkOutDate: { gt: checkInDate },
      OR: [
        { status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] } },
        {
          status: BookingStatus.PENDING,
          holdExpiresAt: { gt: now },
        },
      ],
    },
    include: {
      bookingRooms: true,
    },
  });

  // 3. Fetch overlapping maintenance records for rooms in this hotel
  const blockingMaintenances = await tx.maintenance.findMany({
    where: {
      hotelId,
      status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS] },
      startDate: { lt: checkOutDate },
      endDate: { gt: checkInDate },
    },
  });

  const maintenanceRoomIds = new Set(blockingMaintenances.map((m) => m.roomId));

  // Count booked rooms by roomTypeId
  const bookedRoomCountsByTypeId: Record<string, number> = {};
  for (const b of blockingBookings) {
    for (const br of b.bookingRooms) {
      bookedRoomCountsByTypeId[br.roomTypeId] = (bookedRoomCountsByTypeId[br.roomTypeId] || 0) + 1;
    }
  }

  const results: AvailabilityResult[] = roomTypes.map((rt) => {
    const totalRooms = rt.rooms.length;
    const maintenanceCount = rt.rooms.filter((r) => maintenanceRoomIds.has(r.id)).length;
    const bookedCount = bookedRoomCountsByTypeId[rt.id] || 0;
    const availableRooms = Math.max(0, totalRooms - maintenanceCount - bookedCount);

    const fitsGuests = rt.maxOccupancy >= guests;
    const hasEnoughRooms = availableRooms >= requestedRooms;

    return {
      roomTypeId: rt.id,
      roomTypeName: rt.name,
      description: rt.description,
      basePrice: Number(rt.basePrice),
      maxOccupancy: rt.maxOccupancy,
      maxAdults: rt.maxAdults,
      maxChildren: rt.maxChildren,
      bedConfig: rt.bedConfig,
      roomSizeSqFt: rt.roomSizeSqFt,
      imageUrl: rt.imageUrl,
      totalRooms,
      bookedRooms: bookedCount,
      maintenanceRooms: maintenanceCount,
      availableRooms,
      isAvailable: fitsGuests && hasEnoughRooms,
    };
  });

  return results;
}

export async function verifyAndLockRoomTypeAvailability(
  hotelId: string,
  roomTypeId: string,
  checkInDate: Date,
  checkOutDate: Date,
  quantity: number,
  tx: Prisma.TransactionClient
): Promise<void> {
  const now = new Date();

  // Find room type and total physical rooms
  const roomType = await tx.roomType.findUnique({
    where: { id: roomTypeId },
    include: { rooms: true },
  });

  if (!roomType || roomType.hotelId !== hotelId) {
    throw new AppError('The selected room type does not belong to this hotel.', 400);
  }

  // Count maintenance rooms
  const maintenanceRooms = await tx.maintenance.findMany({
    where: {
      hotelId,
      roomId: { in: roomType.rooms.map((r) => r.id) },
      status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS] },
      startDate: { lt: checkOutDate },
      endDate: { gt: checkInDate },
    },
  });

  const maintenanceCount = maintenanceRooms.length;

  // Count active/confirmed booking rooms for this room type during requested dates
  const overlappingBookings = await tx.bookingRoom.count({
    where: {
      roomTypeId,
      booking: {
        hotelId,
        checkInDate: { lt: checkOutDate },
        checkOutDate: { gt: checkInDate },
        OR: [
          { status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] } },
          {
            status: BookingStatus.PENDING,
            holdExpiresAt: { gt: now },
          },
        ],
      },
    },
  });

  const available = roomType.rooms.length - maintenanceCount - overlappingBookings;

  if (available < quantity) {
    throw new AppError(
      `Insufficient room availability. Requested: ${quantity}, Available: ${Math.max(0, available)}. Please select different dates or room type.`,
      409
    );
  }
}
