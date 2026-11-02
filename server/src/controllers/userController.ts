import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AuthenticatedRequest, AppError } from '../types/index.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        hotelId: true,
        assignedHotel: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);

    const { firstName, lastName, phone } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        hotelId: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);

    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) throw new AppError('User not found.', 404);

    const isMatch = await verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 400);
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function getFavorites(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);

    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        hotel: {
          include: {
            images: { where: { isCover: true }, take: 1 },
            roomTypes: { select: { basePrice: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = favorites.map((f) => ({
      id: f.id,
      hotelId: f.hotelId,
      createdAt: f.createdAt,
      hotel: {
        ...f.hotel,
        startingPrice: f.hotel.roomTypes.length
          ? Math.min(...f.hotel.roomTypes.map((rt) => Number(rt.basePrice)))
          : 0,
        coverImage: f.hotel.images[0]?.url,
      },
    }));

    res.json({ success: true, data: { favorites: formatted } });
  } catch (error) {
    next(error);
  }
}

export async function toggleFavorite(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);

    const { hotelId } = req.params;

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_hotelId: {
          userId: req.user.id,
          hotelId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      res.json({ success: true, isFavorite: false, message: 'Removed from favorites.' });
    } else {
      await prisma.favorite.create({
        data: {
          userId: req.user.id,
          hotelId,
        },
      });
      res.json({ success: true, isFavorite: true, message: 'Added to favorites.' });
    }
  } catch (error) {
    next(error);
  }
}

export async function getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.json({ success: true, data: { notifications } });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401);

    const { id } = req.params;

    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
}
