import React from 'react';
import { Booking } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { X, Printer, Compass, ShieldCheck } from 'lucide-react';

interface InvoiceModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ booking, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const primaryGuest = booking.guests?.find((g) => g.isPrimary) || booking.guests?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto print:p-0 print:shadow-none print:max-w-none">
        {/* Controls */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h3 className="font-serif text-lg font-bold text-slate-800">Reservation Folio & Invoice</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors flex items-center space-x-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Folio Content */}
        <div className="border border-slate-100 p-8 rounded-2xl bg-white space-y-6 print:border-none print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-900 flex items-center justify-center text-white">
                <Compass className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-brand-900">
                  Stay<span className="text-emerald-600 font-sans font-semibold">Ease</span>
                </span>
                <p className="text-xs text-slate-400">Official Guest Reservation Invoice</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-slate-400 block">Folio Reference</span>
              <span className="font-mono text-sm font-bold text-brand-900">{booking.bookingReference}</span>
              <span className="text-[11px] text-slate-500 block mt-1">Issued: {formatDate(booking.createdAt)}</span>
            </div>
          </div>

          {/* Hotel & Guest Information */}
          <div className="grid grid-cols-2 gap-6 text-xs text-slate-600 border-b border-slate-200 pb-6">
            <div>
              <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-1">Property</h5>
              <p className="font-semibold text-slate-800 text-sm">{booking.hotel?.name}</p>
              <p>{booking.hotel?.address}</p>
              <p>{booking.hotel?.city}, {booking.hotel?.country}</p>
              <p className="text-slate-400">{booking.hotel?.phone}</p>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-1">Guest Details</h5>
              <p className="font-semibold text-slate-800 text-sm">
                {primaryGuest ? `${primaryGuest.firstName} ${primaryGuest.lastName}` : 'Guest'}
              </p>
              <p>{primaryGuest?.email}</p>
              <p>{primaryGuest?.phone || 'No phone provided'}</p>
              <div className="mt-2 inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Reservation</span>
              </div>
            </div>
          </div>

          {/* Stay Timeline */}
          <div className="bg-slate-50 p-4 rounded-xl grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Check-In</span>
              <span className="font-bold text-slate-900 text-sm">{formatDate(booking.checkInDate)}</span>
              <span className="text-slate-500 text-[10px] block">From {booking.hotel?.checkInTime || '15:00'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Duration</span>
              <span className="font-bold text-slate-900 text-sm">{booking.totalNights} Nights</span>
              <span className="text-slate-500 text-[10px] block">{booking.bookingRooms?.length || 1} Suite</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Check-Out</span>
              <span className="font-bold text-slate-900 text-sm">{formatDate(booking.checkOutDate)}</span>
              <span className="text-slate-500 text-[10px] block">Until {booking.hotel?.checkOutTime || '11:00'}</span>
            </div>
          </div>

          {/* Itemized charges table */}
          <div>
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-3">Itemized Charges</h5>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-left">
                  <th className="pb-2 font-semibold">Description</th>
                  <th className="pb-2 text-right font-semibold">Amount (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 text-slate-700">
                    Room Rate ({booking.totalNights} nights x {booking.bookingRooms?.length || 1} suite)
                  </td>
                  <td className="py-2.5 text-right font-medium text-slate-900">
                    {formatCurrency(booking.baseTotal)}
                  </td>
                </tr>
                {Number(booking.discountTotal) > 0 && (
                  <tr>
                    <td className="py-2 text-emerald-700 font-medium">
                      Promotional Discount Applied
                    </td>
                    <td className="py-2 text-right font-medium text-emerald-700">
                      -{formatCurrency(booking.discountTotal)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-2 text-slate-600">Local Accommodation Tax (10%)</td>
                  <td className="py-2 text-right text-slate-800">{formatCurrency(booking.taxTotal)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600">Luxury Hospitality & Concierge Fee</td>
                  <td className="py-2 text-right text-slate-800">{formatCurrency(booking.serviceFeeTotal)}</td>
                </tr>
                <tr className="border-t-2 border-slate-900 text-sm">
                  <td className="py-3 font-bold text-brand-900">Total Folio Balance</td>
                  <td className="py-3 text-right font-black text-brand-900 text-base">
                    {formatCurrency(booking.grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Status Footer */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
            <div>
              <p>Payment Status: <span className="font-bold text-emerald-700">PAID & SETTLED</span></p>
              <p className="text-[10px]">Payment Provider: Razorpay Hospitality Services</p>
            </div>
            <div className="text-right">
              <span className="font-serif italic text-slate-400">Thank you for staying with StayEase</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
