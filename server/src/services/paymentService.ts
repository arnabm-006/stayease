import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';
import { AppError } from '../types/index.js';
import { PaymentStatus, BookingStatus, RefundStatus } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { emailService } from './emailService.js';

class PaymentService {
  private razorpay: Razorpay | null = null;
  public readonly isLiveCredentials: boolean = false;

  constructor() {
    const isPlaceholder =
      !env.RAZORPAY_KEY_ID ||
      env.RAZORPAY_KEY_ID === 'rzp_test_placeholder_key_id' ||
      !env.RAZORPAY_KEY_SECRET ||
      env.RAZORPAY_KEY_SECRET === 'rzp_test_placeholder_secret';

    if (!isPlaceholder) {
      try {
        this.razorpay = new Razorpay({
          key_id: env.RAZORPAY_KEY_ID,
          key_secret: env.RAZORPAY_KEY_SECRET,
        });
        this.isLiveCredentials = true;
        logger.info('[PaymentService] Razorpay gateway initialized in test-mode with provided API credentials.');
      } catch (err) {
        logger.warn('[PaymentService] Failed to initialize Razorpay instance:', err);
      }
    } else {
      logger.info(
        '[PaymentService] Razorpay credentials are placeholders. Development Payment Simulator active.'
      );
    }
  }

  async createOrder(bookingId: string, customerId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hotel: true,
        payments: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    if (booking.customerId !== customerId) {
      throw new AppError('Unauthorized access to booking payment.', 403);
    }

    if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.CHECKED_IN) {
      throw new AppError('This booking is already confirmed and paid.', 400);
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new AppError('Cannot pay for a cancelled booking.', 400);
    }

    // Amount in subunits (cents/paise): Grand total * 100
    const amountInSubunits = Math.round(Number(booking.grandTotal) * 100);
    const currency = booking.currency || 'USD';

    let orderId: string;

    if (this.isLiveCredentials && this.razorpay) {
      try {
        const order = await this.razorpay.orders.create({
          amount: amountInSubunits,
          currency: currency,
          receipt: booking.bookingReference,
          notes: {
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            hotelName: booking.hotel.name,
          },
        });
        orderId = order.id;
      } catch (err: any) {
        logger.error('[PaymentService] Razorpay order creation failed:', err?.message || err);
        throw new AppError('Payment gateway could not generate an order. Please try again.', 502);
      }
    } else {
      // Local development simulation order id
      orderId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
    }

    // Upsert payment record in PENDING state
    const payment = await prisma.payment.upsert({
      where: { orderReference: orderId },
      create: {
        bookingId: booking.id,
        orderReference: orderId,
        amount: booking.grandTotal,
        currency,
        status: PaymentStatus.PENDING,
        paymentProvider: this.isLiveCredentials ? 'razorpay' : 'simulation_test_mode',
      },
      update: {
        amount: booking.grandTotal,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      orderId,
      amount: Number(booking.grandTotal),
      amountInSubunits,
      currency,
      keyId: this.isLiveCredentials ? env.RAZORPAY_KEY_ID : 'simulated_test_key',
      bookingReference: booking.bookingReference,
      isSimulated: !this.isLiveCredentials,
      hotelName: booking.hotel.name,
    };
  }

  async verifyPayment(
    bookingId: string,
    orderId: string,
    paymentId: string,
    signature: string,
    isSimulated: boolean = false
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hotel: true,
        guests: { where: { isPrimary: true } },
        customer: true,
        bookingCoupons: { include: { coupon: true } },
      },
    });

    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    // Prevent duplicate confirmation
    if (booking.status === BookingStatus.CONFIRMED) {
      return {
        success: true,
        message: 'Booking has already been verified and confirmed.',
        bookingReference: booking.bookingReference,
      };
    }

    // Verify cryptographic signature
    if (this.isLiveCredentials && !isSimulated) {
      const generatedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (generatedSignature !== signature) {
        // Mark payment as failed
        await prisma.payment.updateMany({
          where: { orderReference: orderId },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: 'Signature verification mismatch.',
          },
        });
        throw new AppError('Invalid payment signature. Transaction verification failed.', 400);
      }
    } else {
      // In simulated mode, ensure production mode doesn't execute simulated payments
      if (env.NODE_ENV === 'production') {
        throw new AppError('Simulated payment mode is disabled in production environment.', 403);
      }
      logger.info(`[PaymentService] Verified transaction in Development Simulated Mode for ${orderId}`);
    }

    // Transactionally finalize booking, payment, and coupon usage
    await prisma.$transaction(async (tx) => {
      // 1. Confirm booking and clear hold expiration
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CONFIRMED,
          holdExpiresAt: null,
        },
      });

      // 2. Mark payment as SUCCESS
      await tx.payment.updateMany({
        where: { orderReference: orderId },
        data: {
          status: PaymentStatus.SUCCESS,
          transactionReference: paymentId,
          signature,
          method: isSimulated ? 'test_simulator' : 'card',
          paidAt: new Date(),
        },
      });

      // 3. Increment coupon usage count if coupon applied
      if (booking.bookingCoupons.length > 0) {
        for (const bc of booking.bookingCoupons) {
          await tx.coupon.update({
            where: { id: bc.couponId },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      // 4. Create in-app notification for the customer
      await tx.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Reservation Confirmed!',
          message: `Your booking at ${booking.hotel.name} (${booking.bookingReference}) has been confirmed.`,
          type: 'BOOKING',
          link: `/dashboard/bookings/${booking.id}`,
        },
      });
    });

    // Send confirmation email asynchronously
    const primaryGuest = booking.guests[0] || {
      email: booking.customer.email,
      firstName: booking.customer.firstName,
    };

    emailService
      .sendBookingConfirmation(
        primaryGuest.email,
        primaryGuest.firstName,
        booking.bookingReference,
        booking.hotel.name,
        booking.checkInDate.toISOString().slice(0, 10),
        booking.checkOutDate.toISOString().slice(0, 10),
        Number(booking.grandTotal)
      )
      .catch((err) => logger.error('[PaymentService] Email dispatch failed:', err));

    return {
      success: true,
      message: 'Payment verified and reservation successfully confirmed.',
      bookingReference: booking.bookingReference,
    };
  }

  async processWebhook(rawBody: string | Buffer, webhookSignature: string) {
    if (!this.isLiveCredentials) {
      return { success: true, message: 'Webhooks simulated in development' };
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== webhookSignature) {
      throw new AppError('Invalid webhook signature.', 400);
    }

    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;

    logger.info(`[PaymentService] Processing Razorpay webhook event: ${event}`);

    if (event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const payment = await prisma.payment.findUnique({
        where: { orderReference: orderId },
      });

      if (payment && payment.status !== PaymentStatus.SUCCESS) {
        await this.verifyPayment(payment.bookingId, orderId, paymentId, 'webhook_verified', false);
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      await prisma.payment.updateMany({
        where: { orderReference: orderId },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: paymentEntity.error_description || 'Payment was declined.',
        },
      });
    }

    return { success: true, received: true };
  }

  async processRefund(paymentId: string, reason: string, customAmount?: number) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: { include: { hotel: true, customer: true } },
      },
    });

    if (!payment) {
      throw new AppError('Payment record not found.', 404);
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new AppError('Only successful payments can be refunded.', 400);
    }

    const refundAmount = customAmount ?? Number(payment.amount);
    const refundRef = `ref_${crypto.randomBytes(8).toString('hex')}`;

    if (this.isLiveCredentials && this.razorpay && payment.transactionReference) {
      try {
        await this.razorpay.payments.refund(payment.transactionReference, {
          amount: Math.round(refundAmount * 100),
          notes: { reason },
        });
      } catch (err: any) {
        logger.error('[PaymentService] Razorpay gateway refund failed:', err?.message || err);
        throw new AppError('Gateway rejected refund request: ' + (err?.error?.description || err?.message), 502);
      }
    }

    const refund = await prisma.$transaction(async (tx) => {
      const createdRefund = await tx.refund.create({
        data: {
          paymentId: payment.id,
          refundReference: refundRef,
          amount: refundAmount,
          reason,
          status: RefundStatus.SUCCESS,
          processedAt: new Date(),
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REFUNDED },
      });

      return createdRefund;
    });

    return refund;
  }
}

export const paymentService = new PaymentService();
