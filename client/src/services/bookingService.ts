import { api } from './api';
import { Booking, PricingBreakdown } from '../types';

export const bookingService = {
  async calculatePrice(payload: {
    hotelId: string;
    roomTypeId: string;
    checkInDate: string;
    checkOutDate: string;
    roomQuantity?: number;
    couponCode?: string;
  }) {
    return api.post<{ success: boolean; data: { pricing: PricingBreakdown } }>(
      '/bookings/price',
      payload
    );
  },

  async createHold(payload: {
    hotelId: string;
    roomTypeId: string;
    checkInDate: string;
    checkOutDate: string;
    roomQuantity: number;
    numAdults: number;
    numChildren: number;
    couponCode?: string;
    specialRequests?: string;
    guests: any[];
  }) {
    return api.post<{
      success: boolean;
      message: string;
      data: {
        booking: Booking;
        pricing: PricingBreakdown;
        holdExpiresAt: string;
      };
    }>('/bookings', payload);
  },

  async getMyBookings() {
    return api.get<{ success: boolean; data: { bookings: Booking[] } }>('/bookings/my');
  },

  async getBookingById(id: string) {
    return api.get<{ success: boolean; data: { booking: Booking } }>(`/bookings/${id}`);
  },

  async cancelBooking(id: string, cancellationReason: string) {
    return api.post<{
      success: boolean;
      data: {
        bookingReference: string;
        refundAmount: number;
        cancellationFee: number;
        message: string;
      };
    }>(`/bookings/${id}/cancel`, { cancellationReason });
  },

  async submitReview(payload: {
    hotelId: string;
    bookingId: string;
    rating: number;
    title: string;
    comment: string;
    staffRating?: number;
    cleanlinessRating?: number;
    comfortRating?: number;
    locationRating?: number;
  }) {
    return api.post('/reviews', payload);
  },
};
