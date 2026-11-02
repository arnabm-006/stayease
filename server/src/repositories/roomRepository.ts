import { prisma } from '../config/db.js';
import { RoomStatus } from '@prisma/client';

export const roomRepository = {
  async findRoomTypes(hotelId?: string) {
    return prisma.roomType.findMany({
      where: hotelId ? { hotelId } : {},
      include: {
        hotel: { select: { name: true, city: true } },
        rooms: true,
      },
    });
  },

  async findRooms(hotelId?: string, status?: RoomStatus) {
    return prisma.room.findMany({
      where: {
        ...(hotelId ? { hotelId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        hotel: { select: { name: true } },
        roomType: { select: { name: true, basePrice: true } },
        maintenances: {
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ hotelId: 'asc' }, { roomNumber: 'asc' }],
    });
  },

  async updateRoomStatus(id: string, status: RoomStatus) {
    return prisma.room.update({
      where: { id },
      data: { status },
    });
  },
};
