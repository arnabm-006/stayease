import { api } from './api';

export const paymentService = {
  async createOrder(bookingId: string) {
    return api.post<{
      success: boolean;
      data: {
        orderId: string;
        amount: number;
        amountInSubunits: number;
        currency: string;
        keyId: string;
        bookingReference: string;
        isSimulated: boolean;
        hotelName: string;
      };
    }>('/payments/create-order', { bookingId });
  },

  async verifyPayment(payload: {
    bookingId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    isSimulated?: boolean;
  }) {
    return api.post<{
      success: boolean;
      message: string;
      data: {
        bookingReference: string;
      };
    }>('/payments/verify', payload);
  },

  async getMyPayments() {
    return api.get<{ success: boolean; data: { payments: any[] } }>('/payments/my');
  },
};
