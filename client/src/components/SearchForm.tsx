import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  Users,
  MapPin,
  AlertCircle,
  Sparkles,
  Waves,
  Building2,
  Compass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface SearchFormProps {
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  initialRooms?: number;
  compact?: boolean;
}

const POPULAR_DESTINATIONS = [
  { label: 'Miami Beach', query: 'Miami', icon: Waves },
  { label: 'Aspen Rockies', query: 'Aspen', icon: Compass },
  { label: 'Kyoto Heritage', query: 'Kyoto', icon: Building2 },
];

export const SearchForm: React.FC<SearchFormProps> = ({
  initialDestination = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 2,
  initialRooms = 1,
  compact = false,
}) => {
  const navigate = useNavigate();

  const getDefaultDates = () => {
    const today = new Date();
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + 1);
    const checkOut = new Date(today);
    checkOut.setDate(today.getDate() + 4);

    return {
      checkIn: checkIn.toISOString().slice(0, 10),
      checkOut: checkOut.toISOString().slice(0, 10),
    };
  };

  const defaults = getDefaultDates();

  const [destination, setDestination] = useState(initialDestination);
  const [checkInDate, setCheckInDate] = useState(initialCheckIn || defaults.checkIn);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOut || defaults.checkOut);
  const [guests, setGuests] = useState(initialGuests);
  const [rooms, setRooms] = useState(initialRooms);
  const [error, setError] = useState<string | null>(null);

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return null;
    const diffTime = Math.abs(new Date(checkOutDate).getTime() - new Date(checkInDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const nights = calculateNights();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inDate < today) {
      setError('Check-in date cannot be in the past.');
      return;
    }

    if (outDate <= inDate) {
      setError('Check-out date must be at least one day after check-in.');
      return;
    }

    const params = new URLSearchParams({
      destination: destination.trim(),
      checkInDate,
      checkOutDate,
      guests: String(guests),
      rooms: String(rooms),
    });

    navigate(`/hotels?${params.toString()}`);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className={`w-full ${compact ? '' : 'max-w-5xl mx-auto'}`}>
      <form
        onSubmit={handleSearch}
        className={`royal-search liquid-glass-panel rounded-[1.5rem] p-3 sm:p-5 relative transition-all duration-300 shadow-[0_16px_44px_-28px_rgba(16,42,58,0.42)] ${
          compact
            ? 'bg-white border border-slate-200'
            : 'bg-white/95 backdrop-blur-xl border border-white shadow-[0_24px_70px_-35px_rgba(16,42,58,0.55)]'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Destination Input */}
          <div className="liquid-glass-control md:col-span-4 p-3 rounded-xl bg-[#f7f6f2] hover:bg-white transition-all duration-200 border border-slate-200 hover:border-emerald-700/40 focus-within:border-emerald-700 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-700/10">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-800" />
              <span>Destination or Sanctuary</span>
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Miami, Aspen, Kyoto..."
              className="w-full bg-transparent text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* Dates & Night Counter */}
          <div className="liquid-glass-control md:col-span-5 grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#f7f6f2] hover:bg-white transition-all duration-200 border border-slate-200 hover:border-emerald-700/40 relative focus-within:border-emerald-700 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-700/10">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-800" />
                <span>Check-in</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-white focus:outline-none cursor-pointer [color-scheme:dark]"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Check-out</span>
                </label>
                {nights && (
                  <span className="liquid-glass-chip text-[9px] font-bold px-2 py-0.5 rounded-full text-[#f2dfaa] border">
                    {nights}N
                  </span>
                )}
              </div>
              <input
                type="date"
                min={checkInDate || todayStr}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-white focus:outline-none cursor-pointer [color-scheme:dark]"
                required
              />
            </div>
          </div>

          {/* Guests & Suites */}
          <div className="liquid-glass-control md:col-span-3 grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#f7f6f2] hover:bg-white transition-all duration-200 border border-slate-200 hover:border-emerald-700/40 focus-within:border-emerald-700 focus-within:bg-white">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-emerald-800" />
                <span>Guests</span>
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-white focus:outline-none cursor-pointer [color-scheme:dark]"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                  <option key={num} value={num} className="bg-[#15171b] text-white">
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center space-x-1">
                <Compass className="w-3.5 h-3.5 text-emerald-800" />
                <span>Suites</span>
              </label>
              <select
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-white focus:outline-none cursor-pointer [color-scheme:dark]"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num} className="bg-[#15171b] text-white">
                    {num} {num === 1 ? 'Suite' : 'Suites'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Row & Chips */}
        <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto text-xs py-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden lg:inline">
              Curated Destinations:
            </span>
            {POPULAR_DESTINATIONS.map((dest) => {
              const Icon = dest.icon;
              return (
                <button
                  key={dest.label}
                  type="button"
                  onClick={() => setDestination(dest.query)}
                  className="liquid-glass-chip inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-slate-200 font-medium transition-all duration-200 border"
                >
                  <Icon className="w-3 h-3 text-[#e2c986]" />
                  <span>{dest.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            className="royal-gold-button liquid-glass-button w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-xs tracking-wide flex items-center justify-center space-x-2 shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <Search className="w-4 h-4" />
            <span>Search stays</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
};
