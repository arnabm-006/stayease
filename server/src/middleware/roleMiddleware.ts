import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest, AppError } from '../types/index.js';

export function authorizeRoles(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
}

export function enforceHotelScope(getHotelId: (req: AuthenticatedRequest) => string | undefined) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (req.user.role === Role.SUPER_ADMIN) {
      return next(); // Super admin has universal access
    }

    const targetHotelId = getHotelId(req);
    if (!targetHotelId) {
      return next();
    }

    if (req.user.role === Role.HOTEL_MANAGER || req.user.role === Role.RECEPTIONIST) {
      if (req.user.hotelId && req.user.hotelId !== targetHotelId) {
        return next(
          new AppError('Access denied: You are not authorized to manage this hotel property.', 403)
        );
      }
    }

    next();
  };
}
