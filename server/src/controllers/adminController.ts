import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AuthenticatedRequest, AppError } from '../types/index.js';
import {
  Role,
  BookingStatus,
  PaymentStatus,
  RoomStatus,
  MaintenanceStatus,
  MaintenancePriority,
  DiscountType,
} from '@prisma/client';
import { transitionBookingStatus } from '../services/bookingService.js';
import { hashPassword } from '../utils/password.js';

// Helper to get scoped hotel filter
function getHotelScopeFilter(req: AuthenticatedRequest) {
  if (req.user?.role === Role.SUPER_ADMIN) {
    return {};
  }
  if (req.user?.hotelId) {
    return { hotelId: req.user.hotelId };
  }
  return {};
}

export async function getDashboardMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const scope = getHotelScopeFilter(req);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const bookingWhere = {
      ...scope,
    };

    const roomWhere = {
      ...(scope.hotelId ? { hotelId: scope.hotelId } : {}),
    };

    // Parallel metric queries
    const [
      totalBookings,
      todayArrivals,
      todayDepartures,
      totalRooms,
      occupiedRooms,
      availableRooms,
      cleaningRooms,
      maintenanceRooms,
      cancelledCount,
      paymentsSuccess,
      paymentsFailed,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count({ where: bookingWhere }),
      prisma.booking.count({
        where: {
          ...bookingWhere,
          checkInDate: { gte: todayStart, lte: todayEnd },
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        },
      }),
      prisma.booking.count({
        where: {
          ...bookingWhere,
          checkOutDate: { gte: todayStart, lte: todayEnd },
          status: BookingStatus.CHECKED_IN,
        },
      }),
      prisma.room.count({ where: roomWhere }),
      prisma.room.count({ where: { ...roomWhere, status: RoomStatus.OCCUPIED } }),
      prisma.room.count({ where: { ...roomWhere, status: RoomStatus.AVAILABLE } }),
      prisma.room.count({ where: { ...roomWhere, status: RoomStatus.CLEANING } }),
      prisma.room.count({ where: { ...roomWhere, status: RoomStatus.MAINTENANCE } }),
      prisma.booking.count({
        where: { ...bookingWhere, status: BookingStatus.CANCELLED },
      }),
      prisma.payment.findMany({
        where: {
          status: PaymentStatus.SUCCESS,
          ...(scope.hotelId ? { booking: { hotelId: scope.hotelId } } : {}),
        },
        select: { amount: true, createdAt: true },
      }),
      prisma.payment.count({
        where: {
          status: PaymentStatus.FAILED,
          ...(scope.hotelId ? { booking: { hotelId: scope.hotelId } } : {}),
        },
      }),
      prisma.booking.findMany({
        where: bookingWhere,
        include: {
          hotel: { select: { name: true } },
          guests: { where: { isPrimary: true } },
          payments: { select: { status: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Calculate confirmed revenue
    const confirmedRevenue = paymentsSuccess.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    // Calculate occupancy rate
    const occupancyRate = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1)) : 0;

    // 7-day revenue trend
    const revenueByDate: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(5, 10); // MM-DD
      revenueByDate[key] = 0;
    }

    for (const p of paymentsSuccess) {
      const key = p.createdAt.toISOString().slice(5, 10);
      if (revenueByDate[key] !== undefined) {
        revenueByDate[key] += Number(p.amount);
      }
    }

    const revenueTrends = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }));

    res.json({
      success: true,
      data: {
        metrics: {
          totalBookings,
          todayArrivals,
          todayDepartures,
          totalRooms,
          occupiedRooms,
          availableRooms,
          cleaningRooms,
          maintenanceRooms,
          occupancyRate,
          confirmedRevenue: Math.round(confirmedRevenue * 100) / 100,
          cancelledCount,
          paymentFailures: paymentsFailed,
        },
        revenueTrends,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ----------------- HOTEL MANAGEMENT -----------------
export async function getAdminHotels(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const scope = getHotelScopeFilter(req);
    const hotels = await prisma.hotel.findMany({
      where: scope.hotelId ? { id: scope.hotelId } : {},
      include: {
        images: true,
        _count: { select: { rooms: true, roomTypes: true, bookings: true, staff: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { hotels } });
  } catch (error) {
    next(error);
  }
}

export async function createAdminHotel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== Role.SUPER_ADMIN) {
      throw new AppError('Only Super Administrators can register new hotel properties.', 403);
    }

    const {
      name,
      description,
      address,
      city,
      state,
      country,
      postalCode,
      phone,
      email,
      starRating = 4,
      checkInTime = '14:00',
      checkOutTime = '11:00',
      cancellationPolicy,
      isPublished = true,
      amenityIds = [],
    } = req.body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const hotel = await prisma.hotel.create({
      data: {
        name,
        slug,
        description,
        address,
        city,
        state,
        country,
        postalCode,
        phone,
        email,
        starRating,
        checkInTime,
        checkOutTime,
        cancellationPolicy,
        isPublished,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
              caption: `${name} Exterior`,
              isCover: true,
              order: 1,
            },
          ],
        },
        amenities: {
          create: amenityIds.map((aId: string) => ({ amenityId: aId })),
        },
      },
      include: { images: true, amenities: { include: { amenity: true } } },
    });

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully.',
      data: { hotel },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminHotel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (req.user?.role !== Role.SUPER_ADMIN && req.user?.hotelId !== id) {
      throw new AppError('Access denied: You cannot edit this hotel property.', 403);
    }

    const updated = await prisma.hotel.update({
      where: { id },
      data: req.body,
    });

    res.json({
      success: true,
      message: 'Hotel updated successfully.',
      data: { hotel: updated },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminHotel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== Role.SUPER_ADMIN) {
      throw new AppError('Only Super Administrators can delete hotel properties.', 403);
    }

    const { id } = req.params;
    await prisma.hotel.delete({ where: { id } });

    res.json({ success: true, message: 'Hotel property removed.' });
  } catch (error) {
    next(error);
  }
}

// ----------------- ROOMS & ROOM TYPES -----------------
export async function getAdminRooms(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const scope = getHotelScopeFilter(req);
    const { hotelId, status, roomTypeId } = req.query as any;

    const targetHotelId = scope.hotelId || hotelId;

    const rooms = await prisma.room.findMany({
      where: {
        ...(targetHotelId ? { hotelId: targetHotelId } : {}),
        ...(status ? { status: status as RoomStatus } : {}),
        ...(roomTypeId ? { roomTypeId } : {}),
      },
      include: {
        hotel: { select: { id: true, name: true } },
        roomType: { select: { id: true, name: true, basePrice: true } },
      },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    });

    res.json({ success: true, data: { rooms } });
  } catch (error) {
    next(error);
  }
}

export async function createAdminRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { hotelId, roomTypeId, roomNumber, floor = 1, status = RoomStatus.AVAILABLE } = req.body;

    if (req.user?.role !== Role.SUPER_ADMIN && req.user?.hotelId !== hotelId) {
      throw new AppError('Unauthorized hotel scope.', 403);
    }

    const room = await prisma.room.create({
      data: {
        hotelId,
        roomTypeId,
        roomNumber,
        floor: Number(floor),
        status,
      },
      include: { roomType: true },
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully.',
      data: { room },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, roomNumber, floor, roomTypeId } = req.body;

    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) throw new AppError('Room not found.', 404);

    if (req.user?.role !== Role.SUPER_ADMIN && req.user?.hotelId !== existing.hotelId) {
      throw new AppError('Unauthorized hotel scope.', 403);
    }

    const updated = await prisma.room.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(roomNumber ? { roomNumber } : {}),
        ...(floor ? { floor: Number(floor) } : {}),
        ...(roomTypeId ? { roomTypeId } : {}),
      },
      include: { roomType: true },
    });

    res.json({
      success: true,
      message: 'Room updated successfully.',
      data: { room: updated },
    });
  } catch (error) {
    next(error);
  }
}

export async function createAdminRoomType(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { hotelId, name, description, basePrice, maxOccupancy, maxAdults, maxChildren, bedConfig, roomSizeSqFt, imageUrl } = req.body;

    if (req.user?.role !== Role.SUPER_ADMIN && req.user?.hotelId !== hotelId) {
      throw new AppError('Unauthorized hotel scope.', 403);
    }

    const roomType = await prisma.roomType.create({
      data: {
        hotelId,
        name,
        description,
        basePrice,
        maxOccupancy: Number(maxOccupancy),
        maxAdults: Number(maxAdults),
        maxChildren: Number(maxChildren || 0),
        bedConfig,
        roomSizeSqFt: Number(roomSizeSqFt || 350),
        imageUrl,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Room type created successfully.',
      data: { roomType },
    });
  } catch (error) {
    next(error);
  }
}

// ----------------- RESERVATIONS & CHECK-IN / CHECK-OUT -----------------
export async function getAdminBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const scope = getHotelScopeFilter(req);
    const { search, status, page = 1, limit = 20 } = req.query as any;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      ...(scope.hotelId ? { hotelId: scope.hotelId } : {}),
    };

    if (status) {
      where.status = status as BookingStatus;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { bookingReference: { contains: term, mode: 'insensitive' } },
        { customer: { email: { contains: term, mode: 'insensitive' } } },
        { customer: { firstName: { contains: term, mode: 'insensitive' } } },
        { customer: { lastName: { contains: term, mode: 'insensitive' } } },
        { guests: { some: { firstName: { contains: term, mode: 'insensitive' } } } },
        { guests: { some: { lastName: { contains: term, mode: 'insensitive' } } } },
        { guests: { some: { email: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          hotel: { select: { id: true, name: true, city: true } },
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          guests: true,
          bookingRooms: { include: { roomType: true, room: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
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

export async function updateBookingStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);

    const { id } = req.params;
    const { status, notes } = req.body;

    const updated = await transitionBookingStatus(
      id,
      status as BookingStatus,
      req.user.id,
      notes
    );

    res.json({
      success: true,
      message: `Booking status updated to ${status}.`,
      data: { booking: updated },
    });
  } catch (error) {
    next(error);
  }
}

// ----------------- HOUSEKEEPING & MAINTENANCE -----------------
export async function getHousekeepingRooms(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const scope = getHotelScopeFilter(req);
    const rooms = await prisma.room.findMany({
      where: {
        ...(scope.hotelId ? { hotelId: scope.hotelId } : {}),
      },
      include: {
        hotel: { select: { name: true } },
        roomType: { select: { name: true } },
        maintenances: {
          where: { status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS] } },
        },
      },
      orderBy: [{ status: 'asc' }, { roomNumber: 'asc' }],
    });

    res.json({ success: true, data: { rooms } });
  } catch (error) {
    next(error);
  }
}

export async function updateRoomCleaningStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g. AVAILABLE or CLEANING

    const room = await prisma.room.update({
      where: { id },
      data: { status: status as RoomStatus },
    });

    res.json({
      success: true,
      message: `Room status updated to ${status}.`,
      data: { room },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMaintenanceList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const scope = getHotelScopeFilter(req);
    const maintenance = await prisma.maintenance.findMany({
      where: {
        ...(scope.hotelId ? { hotelId: scope.hotelId } : {}),
      },
      include: {
        room: { select: { roomNumber: true, floor: true } },
        hotel: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { maintenance } });
  } catch (error) {
    next(error);
  }
}

export async function scheduleMaintenance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { roomId, hotelId, title, description, priority, startDate, endDate, cost } = req.body;

    const maintenance = await prisma.$transaction(async (tx) => {
      const created = await tx.maintenance.create({
        data: {
          roomId,
          hotelId,
          title,
          description,
          priority: (priority as MaintenancePriority) || MaintenancePriority.MEDIUM,
          status: MaintenanceStatus.SCHEDULED,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          cost: cost ? Number(cost) : null,
          createdBy: req.user?.firstName + ' ' + req.user?.lastName,
        },
      });

      // Mark physical room as MAINTENANCE
      await tx.room.update({
        where: { id: roomId },
        data: { status: RoomStatus.MAINTENANCE },
      });

      return created;
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance scheduled.',
      data: { maintenance },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMaintenanceStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body; // COMPLETED, IN_PROGRESS, CANCELLED

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.maintenance.update({
        where: { id },
        data: { status: status as MaintenanceStatus },
        include: { room: true },
      });

      if (status === MaintenanceStatus.COMPLETED || status === MaintenanceStatus.CANCELLED) {
        // Return room to AVAILABLE
        await tx.room.update({
          where: { id: record.roomId },
          data: { status: RoomStatus.AVAILABLE },
        });
      }

      return record;
    });

    res.json({
      success: true,
      message: 'Maintenance status updated.',
      data: { maintenance: updated },
    });
  } catch (error) {
    next(error);
  }
}

// ----------------- COUPONS MANAGEMENT -----------------
export async function getAdminCoupons(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { coupons } });
  } catch (error) {
    next(error);
  }
}

export async function createAdminCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { code, description, discountType, discountValue, minBookingAmount, maxDiscountAmount, startDate, endDate, usageLimit } = req.body;

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        description,
        discountType: discountType as DiscountType,
        discountValue,
        minBookingAmount: minBookingAmount || 0,
        maxDiscountAmount: maxDiscountAmount || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        usageLimit: Number(usageLimit || 100),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully.',
      data: { coupon },
    });
  } catch (error) {
    next(error);
  }
}

// ----------------- STAFF MANAGEMENT (Super Admin) -----------------
export async function getAdminUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== Role.SUPER_ADMIN) {
      throw new AppError('Only Super Administrators can manage user and staff accounts.', 403);
    }

    const users = await prisma.user.findMany({
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
        assignedHotel: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { users } });
  } catch (error) {
    next(error);
  }
}

export async function createStaffMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== Role.SUPER_ADMIN) {
      throw new AppError('Only Super Administrators can provision staff accounts.', 403);
    }

    const { email, password, firstName, lastName, phone, role, hotelId } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('A user with this email already exists.', 409);

    const passwordHash = await hashPassword(password);

    const staff = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: role as Role,
        hotelId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        hotelId: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Staff member provisioned successfully.',
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
}
