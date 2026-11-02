import React, { useState } from 'react';
import { Booking } from '../types';
import { bookingService } from '../services/bookingService';
import { X, Star, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ReviewModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ booking, isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const [rating, setRating] = useState(5);
  const [staffRating, setStaffRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [comfortRating, setComfortRating] = useState(5);
  const [locationRating, setLocationRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await bookingService.submitReview({
        hotelId: booking.hotelId,
        bookingId: booking.id,
        rating,
        staffRating,
        cleanlinessRating,
        comfortRating,
        locationRating,
        title,
        comment,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-slate-900">Review Your Stay</h3>
            <p className="text-xs text-slate-500">{booking.hotel?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Overall Rating */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Overall Experience
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm font-bold text-slate-700 ml-2">{rating} / 5 Stars</span>
            </div>
          </div>

          {/* Sub ratings */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Staff & Hospitality</span>
              <select
                value={staffRating}
                onChange={(e) => setStaffRating(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800"
              >
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>
                    {s} Stars
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">Cleanliness</span>
              <select
                value={cleanlinessRating}
                onChange={(e) => setCleanlinessRating(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800"
              >
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>
                    {s} Stars
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">Room Comfort</span>
              <select
                value={comfortRating}
                onChange={(e) => setComfortRating(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800"
              >
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>
                    {s} Stars
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">Property Location</span>
              <select
                value={locationRating}
                onChange={(e) => setLocationRating(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800"
              >
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>
                    {s} Stars
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Headline
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unrivaled hospitality and serene views"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900"
              required
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Your Review
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details of your experience, the amenities, or personal highlights..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Submit Verified Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
