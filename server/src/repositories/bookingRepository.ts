import { prisma } from '../config/db.js';
import { Prisma, BookingStatus } from '@prisma/client';

export const bookingRepository = {
  async findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        hotel: { include: { images: true } },
        bookingRooms: {
          include: {
            roomType: true,
            room: true,
          },
        },
        guests: true,
        payments: true,
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        bookingCoupons: { include: { coupon: true } },
      },
    });
  },

  async findByReference(bookingReference: string) {
    return prisma.booking.findUnique({
      where: { bookingReference },
      include: {
        hotel: true,
        bookingRooms: { include: { roomType: true, room: true } },
        guests: true,
        payments: true,
      },
    });
  },

  async findUserBookings(customerId: string) {
    return prisma.booking.findMany({
      where: { customerId },
      include: {
        hotel: { include: { images: true } },
        bookingRooms: { include: { roomType: true } },
        guests: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findHotelBookings(hotelId?: string, status?: BookingStatus, search?: string) {
    const where: Prisma.BookingWhereInput = {};
    if (hotelId) where.hotelId = hotelId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { bookingReference: { contains: search, mode: 'insensitive' } },
        { guests: { some: { firstName: { contains: search, mode: 'insensitive' } } } },
        { guests: { some: { lastName: { contains: search, mode: 'insensitive' } } } },
        { guests: { some: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    return prisma.booking.findMany({
      where,
      include: {
        hotel: { select: { name: true, city: true } },
        bookingRooms: { include: { roomType: { select: { name: true } }, room: true } },
        guests: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateStatus(id: string, status: BookingStatus) {
    return prisma.booking.update({
      where: { id },
      data: { status },
    });
  },
};
