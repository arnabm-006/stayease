import { prisma } from '../config/db.js';
import { Prisma } from '@prisma/client';

export const userRepository = {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        hotelId: true,
        isActive: true,
        createdAt: true,
      },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  async findStaff(hotelId?: string) {
    return prisma.user.findMany({
      where: {
        role: { in: ['RECEPTIONIST', 'HOTEL_MANAGER', 'SUPER_ADMIN'] },
        ...(hotelId ? { hotelId } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        hotelId: true,
        assignedHotel: { select: { name: true } },
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
