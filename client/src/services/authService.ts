import { api } from './api';
import { User } from '../types';

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const authService = {
  async register(data: any): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register', data);
  },

  async login(credentials: any): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
      return res.data?.user || null;
    } catch {
      return null;
    }
  },

  async forgotPassword(email: string): Promise<any> {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<any> {
    return api.post('/auth/reset-password', { token, password });
  },
};
