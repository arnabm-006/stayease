import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { Booking } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  CheckCircle2,
  Calendar,
  MapPin,
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const BookingConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      if (!id) return;
      try {
        const res = await bookingService.getBookingById(id);
        setBooking(res.data.booking);
      } catch (err) {
        console.error('Failed to load booking confirmation:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-500">Retrieving your confirmed reservation...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Booking Not Found</h2>
        <Link to="/dashboard" className="text-sm text-emerald-700 font-bold">
          Go to Customer Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Confirmation Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-elevated p-8 sm:p-12 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
            Confirmed & Guaranteed
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900">
            We Look Forward to Welcoming You
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-lg mx-auto">
            A confirmation email with your booking itinerary and check-in guidelines has been dispatched.
          </p>
        </div>

        {/* Reference Banner */}
        <div className="inline-block px-6 py-3 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Booking Reference
          </span>
          <span className="font-mono text-xl font-extrabold text-brand-900 tracking-wider">
            {booking.bookingReference}
          </span>
        </div>

        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setInvoiceOpen(true)}
            className="px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all flex items-center space-x-2"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>View & Print Official Folio</span>
          </button>

          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2"
          >
            <span>View in My Bookings</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Reservation Details Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle p-8 space-y-6">
        <h3 className="font-serif text-xl font-bold text-brand-900 border-b border-slate-100 pb-4">
          Stay Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold text-base text-slate-900 mb-1">{booking.hotel?.name}</h4>
            <p className="text-xs text-slate-500">{booking.hotel?.address}</p>
            <p className="text-xs text-slate-500 mb-4">{booking.hotel?.city}, {booking.hotel?.country}</p>

            <div className="space-y-1.5 text-xs text-slate-600">
              <p>Check-In: <strong>{formatDate(booking.checkInDate)}</strong> (From {booking.hotel?.checkInTime})</p>
              <p>Check-Out: <strong>{formatDate(booking.checkOutDate)}</strong> (Until {booking.hotel?.checkOutTime})</p>
              <p>Duration: <strong>{booking.totalNights} Nights</strong></p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl space-y-3 text-xs">
            <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Payment Summary</h5>
            <div className="flex justify-between">
              <span>Room Total</span>
              <span className="font-semibold text-slate-900">{formatCurrency(booking.baseTotal)}</span>
            </div>
            {Number(booking.discountTotal) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount Applied</span>
                <span>-{formatCurrency(booking.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Taxes & Service Fees</span>
              <span>{formatCurrency(Number(booking.taxTotal) + Number(booking.serviceFeeTotal))}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-brand-900">
              <span>Total Amount Paid</span>
              <span>{formatCurrency(booking.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        booking={booking}
        isOpen={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
      />
    </div>
  );
};
