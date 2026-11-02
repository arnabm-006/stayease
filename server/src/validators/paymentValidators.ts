import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, 'Booking ID is required'),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, 'Booking ID is required'),
    razorpay_order_id: z.string().min(1, 'Order ID is required'),
    razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
    razorpay_signature: z.string().min(1, 'Signature is required'),
    isSimulated: z.boolean().optional(),
  }),
});

export const refundPaymentSchema = z.object({
  body: z.object({
    reason: z.string().min(3, 'Reason is required'),
    amount: z.number().positive().optional(),
  }),
});
