import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Booking } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const loadBookings = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await adminService.getBookings({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setBookings(res.data.bookings);
    } catch (err) {
      console.error('Failed to load admin bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBookings();
  };

  const handleStatusTransition = async (bookingId: string, nextStatus: string) => {
    setActionLoading(bookingId);
    setActionError(null);
    try {
      await adminService.updateBookingStatus(bookingId, nextStatus);
      await loadBookings();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update booking status.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-slate-900">Reservations & Front Desk</h2>
        <p className="text-xs text-slate-500">
          Search reservations, process guest check-ins & check-outs, and manage booking lifecycles.
        </p>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-subtle flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, guest name or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="PENDING">Hold Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="p-4">Reference</th>
                <th className="p-4">Guest</th>
                <th className="p-4">Dates & Nights</th>
                <th className="p-4">Room & Property</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Desk Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => {
                const primaryGuest = b.guests?.find((g) => g.isPrimary) || b.guests?.[0];
                return (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {b.bookingReference}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">
                        {primaryGuest ? `${primaryGuest.firstName} ${primaryGuest.lastName}` : 'Guest'}
                      </div>
                      <div className="text-[11px] text-slate-400">{primaryGuest?.email}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div>{formatDate(b.checkInDate)} &rarr; {formatDate(b.checkOutDate)}</div>
                      <span className="text-[10px] text-slate-400">{b.totalNights} Nights</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 block">{b.hotel?.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {b.bookingRooms?.[0]?.roomType?.name}
                        {b.bookingRooms?.[0]?.room?.roomNumber && (
                          <strong className="text-emerald-700 ml-1">
                            (Rm #{b.bookingRooms[0].room.roomNumber})
                          </strong>
                        )}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {formatCurrency(b.grandTotal)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : b.status === 'CHECKED_IN'
                            ? 'bg-blue-50 text-blue-700'
                            : b.status === 'CHECKED_OUT'
                            ? 'bg-slate-100 text-slate-700'
                            : b.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleStatusTransition(b.id, 'CHECKED_IN')}
                          disabled={actionLoading === b.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all"
                        >
                          Check In Guest
                        </button>
                      )}

                      {b.status === 'CHECKED_IN' && (
                        <button
                          onClick={() => handleStatusTransition(b.id, 'CHECKED_OUT')}
                          disabled={actionLoading === b.id}
                          className="px-3 py-1.5 rounded-lg bg-brand-900 hover:bg-brand-800 text-white font-bold text-[11px] shadow-sm transition-all"
                        >
                          Check Out Guest
                        </button>
                      )}

                      {b.status === 'PENDING' && (
                        <span className="text-[11px] text-amber-700 font-semibold italic">
                          Awaiting Payment
                        </span>
                      )}

                      {(b.status === 'CHECKED_OUT' || b.status === 'CANCELLED') && (
                        <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
