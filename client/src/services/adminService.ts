import { api } from './api';
import { DashboardMetrics, Hotel, Room, Booking } from '../types';

export const adminService = {
  async getDashboardMetrics() {
    return api.get<{
      success: boolean;
      data: {
        metrics: DashboardMetrics;
        revenueTrends: Array<{ date: string; revenue: number }>;
        recentBookings: any[];
      };
    }>('/admin/dashboard');
  },

  async getHotels() {
    return api.get<{ success: boolean; data: { hotels: Hotel[] } }>('/admin/hotels');
  },

  async createHotel(payload: any) {
    return api.post<{ success: boolean; data: { hotel: Hotel } }>('/admin/hotels', payload);
  },

  async updateHotel(id: string, payload: any) {
    return api.patch<{ success: boolean; data: { hotel: Hotel } }>(`/admin/hotels/${id}`, payload);
  },

  async deleteHotel(id: string) {
    return api.delete(`/admin/hotels/${id}`);
  },

  async getRooms(params?: { hotelId?: string; status?: string }) {
    return api.get<{ success: boolean; data: { rooms: Room[] } }>('/admin/rooms', { params });
  },

  async createRoom(payload: any) {
    return api.post<{ success: boolean; data: { room: Room } }>('/admin/rooms', payload);
  },

  async updateRoom(id: string, payload: any) {
    return api.patch<{ success: boolean; data: { room: Room } }>(`/admin/rooms/${id}`, payload);
  },

  async createRoomType(payload: any) {
    return api.post('/admin/room-types', payload);
  },

  async getBookings(params?: { search?: string; status?: string; page?: number }) {
    return api.get<{
      success: boolean;
      data: {
        bookings: Booking[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      };
    }>('/admin/bookings', { params });
  },

  async updateBookingStatus(id: string, status: string, notes?: string) {
    return api.patch(`/admin/bookings/${id}/status`, { status, notes });
  },

  async getHousekeeping() {
    return api.get<{ success: boolean; data: { rooms: any[] } }>('/admin/housekeeping');
  },

  async updateRoomCleaningStatus(id: string, status: string) {
    return api.patch(`/admin/rooms/${id}/cleaning`, { status });
  },

  async getMaintenance() {
    return api.get<{ success: boolean; data: { maintenance: any[] } }>('/admin/maintenance');
  },

  async scheduleMaintenance(payload: any) {
    return api.post('/admin/maintenance', payload);
  },

  async updateMaintenanceStatus(id: string, status: string) {
    return api.patch(`/admin/maintenance/${id}`, { status });
  },

  async getCoupons() {
    return api.get<{ success: boolean; data: { coupons: any[] } }>('/admin/coupons');
  },

  async createCoupon(payload: any) {
    return api.post('/admin/coupons', payload);
  },

  async getUsers() {
    return api.get<{ success: boolean; data: { users: any[] } }>('/admin/users');
  },

  async createStaff(payload: any) {
    return api.post('/admin/staff', payload);
  },
};
