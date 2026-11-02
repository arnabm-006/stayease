import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AppError } from '../types/index.js';
import { checkHotelAvailability } from '../services/availabilityEngine.js';

export async function searchHotels(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      destination,
      checkInDate,
      checkOutDate,
      guests = 1,
      rooms = 1,
      minPrice,
      maxPrice,
      starRating,
      amenity,
      sortBy = 'popularity',
      page = 1,
      limit = 10,
    } = req.query as any;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isPublished: true,
    };

    if (destination && destination.trim()) {
      const term = destination.trim();
      where.OR = [
        { city: { contains: term, mode: 'insensitive' } },
        { name: { contains: term, mode: 'insensitive' } },
        { state: { contains: term, mode: 'insensitive' } },
        { country: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (starRating) {
      where.starRating = { gte: Number(starRating) };
    }

    if (amenity && amenity.trim()) {
      where.amenities = {
        some: {
          amenity: {
            name: { contains: amenity.trim(), mode: 'insensitive' },
          },
        },
      };
    }

    // Room price filtering
    if (minPrice || maxPrice) {
      where.roomTypes = {
        some: {
          basePrice: {
            ...(minPrice ? { gte: Number(minPrice) } : {}),
            ...(maxPrice ? { lte: Number(maxPrice) } : {}),
          },
        },
      };
    }

    // Sorting
    let orderBy: any = [{ starRating: 'desc' }, { createdAt: 'desc' }];
    if (sortBy === 'price_asc') {
      orderBy = { roomTypes: { _count: 'asc' } }; // standard default
    } else if (sortBy === 'rating_desc') {
      orderBy = { starRating: 'desc' };
    }

    const [total, hotels] = await Promise.all([
      prisma.hotel.count({ where }),
      prisma.hotel.findMany({
        where,
        include: {
          images: { orderBy: { order: 'asc' } },
          amenities: { include: { amenity: true } },
          roomTypes: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              maxOccupancy: true,
            },
          },
          reviews: {
            where: { isApproved: true },
            select: { rating: true },
          },
          _count: { select: { reviews: true, bookings: true } },
        },
        skip,
        take: limitNum,
        orderBy,
      }),
    ]);

    // Format results with starting price, cover image, and average review rating
    const formattedHotels = await Promise.all(
      hotels.map(async (h) => {
        const coverImage =
          h.images.find((img) => img.isCover)?.url ||
          h.images[0]?.url ||
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

        const startingPrice = h.roomTypes.length
          ? Math.min(...h.roomTypes.map((rt) => Number(rt.basePrice)))
          : 0;

        const avgRating =
          h.reviews.length > 0
            ? Number((h.reviews.reduce((acc, r) => acc + r.rating, 0) / h.reviews.length).toFixed(1))
            : h.starRating;

        // If dates are provided, check available room types
        let availableRoomCount: number | null = null;
        if (checkInDate && checkOutDate) {
          try {
            const avail = await checkHotelAvailability(
              h.id,
              String(checkInDate),
              String(checkOutDate),
              Number(guests),
              Number(rooms)
            );
            availableRoomCount = avail.filter((a) => a.isAvailable).length;
          } catch {
            availableRoomCount = null;
          }
        }

        return {
          id: h.id,
          name: h.name,
          slug: h.slug,
          description: h.description,
          address: h.address,
          city: h.city,
          state: h.state,
          country: h.country,
          starRating: h.starRating,
          startingPrice,
          coverImage,
          images: h.images,
          amenities: h.amenities.map((ha) => ha.amenity),
          reviewCount: h._count.reviews,
          averageRating: avgRating,
          availableRoomCount,
        };
      })
    );

    res.json({
      success: true,
      data: {
        hotels: formattedHotels,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getFeaturedHotels(req: Request, res: Response, next: NextFunction) {
  try {
    const hotels = await prisma.hotel.findMany({
      where: { isPublished: true },
      take: 4,
      orderBy: { starRating: 'desc' },
      include: {
        images: { orderBy: { order: 'asc' } },
        amenities: { include: { amenity: true }, take: 5 },
        roomTypes: { select: { basePrice: true } },
        reviews: { select: { rating: true } },
      },
    });

    const formatted = hotels.map((h) => {
      const coverImage =
        h.images.find((img) => img.isCover)?.url || h.images[0]?.url;
      const startingPrice = h.roomTypes.length
        ? Math.min(...h.roomTypes.map((rt) => Number(rt.basePrice)))
        : 0;
      const avgRating =
        h.reviews.length > 0
          ? Number((h.reviews.reduce((acc, r) => acc + r.rating, 0) / h.reviews.length).toFixed(1))
          : h.starRating;

      return {
        id: h.id,
        name: h.name,
        slug: h.slug,
        city: h.city,
        state: h.state,
        country: h.country,
        description: h.description,
        starRating: h.starRating,
        startingPrice,
        coverImage,
        amenities: h.amenities.map((ha) => ha.amenity),
        reviewCount: h.reviews.length,
        averageRating: avgRating,
      };
    });

    res.json({ success: true, data: { hotels: formatted } });
  } catch (error) {
    next(error);
  }
}

export async function getPopularDestinations(req: Request, res: Response, next: NextFunction) {
  try {
    const destinations = [
      {
        city: 'Miami Beach',
        country: 'United States',
        image: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=800&q=80',
        tagline: 'Art deco glamour & sun-soaked Atlantic sands',
      },
      {
        city: 'Aspen',
        country: 'United States',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        tagline: 'World-class alpine skiing & mountain luxury',
      },
      {
        city: 'Kyoto',
        country: 'Japan',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
        tagline: 'Bamboo sanctuaries & imperial heritage',
      },
      {
        city: 'Dubai',
        country: 'United Arab Emirates',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
        tagline: 'Futuristic opulence and desert oases',
      },
    ];

    res.json({ success: true, data: { destinations } });
  } catch (error) {
    next(error);
  }
}

export async function getHotelDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const hotel = await prisma.hotel.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isPublished: true,
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        amenities: { include: { amenity: true } },
        roomTypes: {
          include: {
            rooms: { select: { id: true, status: true } },
          },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!hotel) {
      throw new AppError('Hotel not found.', 404);
    }

    const avgRating =
      hotel.reviews.length > 0
        ? Number(
            (
              hotel.reviews.reduce((acc, r) => acc + r.rating, 0) /
              hotel.reviews.length
            ).toFixed(1)
          )
        : hotel.starRating;

    res.json({
      success: true,
      data: {
        hotel: {
          ...hotel,
          averageRating: avgRating,
          reviewCount: hotel.reviews.length,
          amenities: hotel.amenities.map((ha) => ha.amenity),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getHotelRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId: id },
      include: {
        rooms: { select: { id: true, roomNumber: true, floor: true, status: true } },
      },
    });

    res.json({ success: true, data: { roomTypes } });
  } catch (error) {
    next(error);
  }
}

export async function getHotelAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { checkInDate, checkOutDate, guests = 1, rooms = 1 } = req.query as any;

    if (!checkInDate || !checkOutDate) {
      throw new AppError('checkInDate and checkOutDate query parameters are required.', 400);
    }

    const availability = await checkHotelAvailability(
      id,
      String(checkInDate),
      String(checkOutDate),
      Number(guests),
      Number(rooms)
    );

    res.json({ success: true, data: { availability } });
  } catch (error) {
    next(error);
  }
}
