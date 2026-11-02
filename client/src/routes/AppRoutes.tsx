import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Public & Customer Pages
import { HomePageEditorial as HomePage } from '../pages/HomePageEditorial';
import { HotelSearchPage } from '../pages/HotelSearchPage';
import { HotelDetailsPage } from '../pages/HotelDetailsPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { BookingConfirmationPage } from '../pages/BookingConfirmationPage';
import { CustomerDashboardPage } from '../pages/CustomerDashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';

// Admin Pages
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminHotelsPage } from '../pages/AdminHotelsPage';
import { AdminRoomsPage } from '../pages/AdminRoomsPage';
import { AdminBookingsPage } from '../pages/AdminBookingsPage';
import { AdminHousekeepingPage } from '../pages/AdminHousekeepingPage';
import { AdminCouponsPage } from '../pages/AdminCouponsPage';
import { AdminStaffPage } from '../pages/AdminStaffPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public & Customer Website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/hotels" element={<HotelSearchPage />} />
        <Route path="/hotels/:id" element={<HotelDetailsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/booking-confirmation/:id" element={<BookingConfirmationPage />} />
        <Route path="/dashboard" element={<CustomerDashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Hotel Administration Dashboard */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="hotels" element={<AdminHotelsPage />} />
        <Route path="rooms" element={<AdminRoomsPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="housekeeping" element={<AdminHousekeepingPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="staff" element={<AdminStaffPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
