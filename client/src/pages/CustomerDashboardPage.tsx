import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/bookingService';
import { api } from '../services/api';
import { Booking } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';
import { ReviewModal } from '../components/ReviewModal';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  Calendar,
  User as UserIcon,
  Heart,
  Bell,
  Clock,
  Printer,
  XCircle,
  Star,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export const CustomerDashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'bookings';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of personal travel plans');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Profile Form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'bookings') {
        const res = await bookingService.getMyBookings();
        setBookings(res.data?.bookings || []);
      } else if (activeTab === 'favorites') {
        const res = await api.get<{ success: boolean; data: { favorites: any[] } }>('/users/favorites');
        setFavorites(res.data?.favorites || []);
      } else if (activeTab === 'notifications') {
        const res = await api.get<{ success: boolean; data: { notifications: any[] } }>('/users/notifications');
        setNotifications(res.data?.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    try {
      await api.patch('/users/me', { firstName, lastName, phone });
      await refreshUser();
      setProfileMessage('Profile details successfully updated.');
    } catch (err: any) {
      setProfileMessage(err?.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setProfileMessage('Password changed successfully.');
    } catch (err: any) {
      setProfileMessage(err?.message || 'Failed to change password.');
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);
    setCancelError(null);

    try {
      await bookingService.cancelBooking(cancelModalBooking.id, cancelReason);
      setCancelModalBooking(null);
      await loadDashboardData();
    } catch (err: any) {
      setCancelError(err?.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  };

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Confirmed</span>;
      case 'CHECKED_IN':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Checked In</span>;
      case 'CHECKED_OUT':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Completed Stay</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Hold Pending</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900">
            Welcome, {user?.firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your past and upcoming reservations, profile preferences, and saved retreats.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1.5 p-1.5 bg-slate-200/60 rounded-2xl">
          <button
            onClick={() => setTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-white text-brand-900 shadow-sm'
                : 'text-slate-600 hover:text-brand-900'
            }`}
          >
            My Bookings
          </button>
          <button
            onClick={() => setTab('favorites')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'favorites'
                ? 'bg-white text-brand-900 shadow-sm'
                : 'text-slate-600 hover:text-brand-900'
            }`}
          >
            Saved Retreats
          </button>
          <button
            onClick={() => setTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-brand-900 shadow-sm'
                : 'text-slate-600 hover:text-brand-900'
            }`}
          >
            Profile & Security
          </button>
        </div>
      </div>

      {/* Tab: Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-900 animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-400">Loading your reservations...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-16 rounded-3xl bg-white border border-slate-100 shadow-subtle text-center space-y-4">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-serif text-xl font-bold text-slate-800">No Reservations Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Discover our handpicked collection of luxury resorts and coastal retreats.
              </p>
              <a
                href="/hotels"
                className="inline-block px-6 py-2.5 rounded-xl bg-brand-900 text-white text-xs font-bold"
              >
                Explore Destinations
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-6 rounded-3xl bg-white border border-slate-100 shadow-subtle flex flex-col md:flex-row justify-between gap-6 hover:shadow-card transition-shadow"
                >
                  <div className="flex space-x-5">
                    <img
                      src={
                        booking.hotel?.images?.[0]?.url ||
                        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={booking.hotel?.name}
                      className="w-28 h-28 rounded-2xl object-cover shrink-0"
                    />
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(booking.status)}
                        <span className="font-mono text-xs text-slate-400">
                          {booking.bookingReference}
                        </span>
                      </div>
                      <h4 className="font-serif text-lg font-bold text-brand-900">
                        {booking.hotel?.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {formatDate(booking.checkInDate)} &rarr; {formatDate(booking.checkOutDate)} ({booking.totalNights} Nights)
                      </p>
                      <p className="text-xs font-semibold text-brand-900">
                        Total: {formatCurrency(booking.grandTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap md:flex-col justify-end gap-2 shrink-0">
                    <button
                      onClick={() => setInvoiceBooking(booking)}
                      className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-400" />
                      <span>Invoice Folio</span>
                    </button>

                    {booking.status === 'CHECKED_OUT' && !booking.review && (
                      <button
                        onClick={() => setReviewBooking(booking)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Leave Verified Review</span>
                      </button>
                    )}

                    {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                      <button
                        onClick={() => setCancelModalBooking(booking)}
                        className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors text-left"
                      >
                        Cancel Reservation
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Saved Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-900 animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-400">Loading saved sanctuaries...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="p-16 rounded-3xl bg-white border border-slate-100 shadow-subtle text-center space-y-4">
              <Heart className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-serif text-xl font-bold text-slate-800">No Saved Sanctuaries</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Save your favorite luxury hotels to monitor availability and plan your future escapes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((fav) => (
                <div key={fav.id} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-subtle space-y-3">
                  <img
                    src={fav.hotel?.coverImage}
                    alt={fav.hotel?.name}
                    className="w-full h-44 rounded-2xl object-cover"
                  />
                  <h4 className="font-serif text-lg font-bold text-brand-900">{fav.hotel?.name}</h4>
                  <p className="text-xs text-slate-500">{fav.hotel?.city}, {fav.hotel?.country}</p>
                  <a
                    href={`/hotels/${fav.hotel?.slug || fav.hotel?.id}`}
                    className="block w-full text-center py-2 rounded-xl bg-brand-900 text-white text-xs font-bold"
                  >
                    View Details
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Profile & Security */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Details */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-subtle space-y-5">
            <h3 className="font-serif text-xl font-bold text-brand-900 border-b border-slate-100 pb-3">
              Profile Information
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs font-semibold text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-brand-900 text-white font-bold text-xs hover:bg-brand-800 transition-colors"
              >
                Update Profile
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-subtle space-y-5">
            <h3 className="font-serif text-xl font-bold text-brand-900 border-b border-slate-100 pb-3">
              Change Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Change Password
              </button>

              {profileMessage && (
                <div className="p-3 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium border border-slate-200">
                  {profileMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceBooking && (
        <InvoiceModal
          booking={invoiceBooking}
          isOpen={!!invoiceBooking}
          onClose={() => setInvoiceBooking(null)}
        />
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => loadDashboardData()}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-slate-900 text-center">
              Cancel Reservation?
            </h3>
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Are you sure you wish to cancel booking <strong>{cancelModalBooking.bookingReference}</strong> at {cancelModalBooking.hotel?.name}?
            </p>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
              <span className="font-bold block mb-1">Cancellation Policy:</span>
              <p className="text-[11px] leading-tight text-slate-500">
                {cancelModalBooking.hotel?.cancellationPolicy || 'Complimentary cancellation up to 48 hours before check-in date.'}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Reason for cancellation
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>

            {cancelError && (
              <p className="text-xs text-rose-600 font-semibold">{cancelError}</p>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
