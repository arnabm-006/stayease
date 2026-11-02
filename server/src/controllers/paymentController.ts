import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AuthenticatedRequest, AppError } from '../types/index.js';
import { paymentService } from '../services/paymentService.js';
import { Role } from '@prisma/client';

export async function createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const { bookingId } = req.body;
    const orderData = await paymentService.createOrder(bookingId, req.user.id);

    res.json({
      success: true,
      data: orderData,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature, isSimulated } = req.body;

    const result = await paymentService.verifyPayment(
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      isSimulated
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleWebhook(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

    const result = await paymentService.processWebhook(rawBody, signature || '');

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMyPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const payments = await prisma.payment.findMany({
      where: {
        booking: { customerId: req.user.id },
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            hotel: { select: { id: true, name: true, city: true } },
          },
        },
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { payments },
    });
  } catch (error) {
    next(error);
  }
}

export async function refundPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    if (req.user.role !== Role.HOTEL_MANAGER && req.user.role !== Role.SUPER_ADMIN) {
      throw new AppError('Only managers and administrators can issue refunds.', 403);
    }

    const { id } = req.params;
    const { reason, amount } = req.body;

    const refund = await paymentService.processRefund(id, reason, amount);

    res.json({
      success: true,
      message: 'Refund processed successfully.',
      data: { refund },
    });
  } catch (error) {
    next(error);
  }
}
