import { api } from './api';
import { Hotel } from '../types';

export interface HotelSearchParams {
  destination?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
  starRating?: number;
  amenity?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export const hotelService = {
  async searchHotels(params: HotelSearchParams) {
    return api.get<{
      success: boolean;
      data: {
        hotels: Hotel[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    }>('/hotels', { params });
  },

  async getFeaturedHotels() {
    return api.get<{ success: boolean; data: { hotels: Hotel[] } }>('/hotels/featured');
  },

  async getPopularDestinations() {
    return api.get<{ success: boolean; data: { destinations: any[] } }>('/hotels/destinations');
  },

  async getHotelDetails(idOrSlug: string) {
    return api.get<{ success: boolean; data: { hotel: Hotel } }>(`/hotels/${idOrSlug}`);
  },

  async checkAvailability(hotelId: string, checkInDate: string, checkOutDate: string, guests = 1, rooms = 1) {
    return api.get<{ success: boolean; data: { availability: any[] } }>(
      `/hotels/${hotelId}/availability`,
      { params: { checkInDate, checkOutDate, guests, rooms } }
    );
  },
};
