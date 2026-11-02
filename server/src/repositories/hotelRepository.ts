import { prisma } from '../config/db.js';
import { Prisma } from '@prisma/client';

export const hotelRepository = {
  async findById(id: string) {
    return prisma.hotel.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        amenities: { include: { amenity: true } },
        roomTypes: {
          include: {
            rooms: true,
          },
        },
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  async findBySlug(slug: string) {
    return prisma.hotel.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: 'asc' } },
        amenities: { include: { amenity: true } },
        roomTypes: true,
      },
    });
  },

  async findMany(where: Prisma.HotelWhereInput, skip?: number, take?: number, orderBy?: Prisma.HotelOrderByWithRelationInput) {
    return prisma.hotel.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        images: true,
        amenities: { include: { amenity: true } },
        roomTypes: { select: { basePrice: true } },
        reviews: { select: { rating: true } },
      },
    });
  },

  async count(where: Prisma.HotelWhereInput) {
    return prisma.hotel.count({ where });
  },

  async create(data: Prisma.HotelCreateInput) {
    return prisma.hotel.create({ data });
  },

  async update(id: string, data: Prisma.HotelUpdateInput) {
    return prisma.hotel.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.hotel.delete({ where: { id } });
  },
};
