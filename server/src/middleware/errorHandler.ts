import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`Error processing ${req.method} ${req.originalUrl}:`, err?.message || err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details || null,
    });
    return;
  }

  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatted,
    });
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (err?.code === 'P2002') {
    const fields = err.meta?.target ? ` (${err.meta.target})` : '';
    res.status(409).json({
      success: false,
      message: `A record with this unique field already exists${fields}.`,
    });
    return;
  }

  // Prisma record not found (P2025)
  if (err?.code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'The requested record was not found.',
    });
    return;
  }

  const statusCode = err.status || err.statusCode || 500;
  const response: any = {
    success: false,
    message: statusCode === 500 && env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message || 'An unexpected error occurred',
  };

  if (env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
