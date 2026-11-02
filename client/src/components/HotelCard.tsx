import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hotel } from '../types';
import { formatCurrency } from '../lib/utils';
import {
  Star,
  MapPin,
  Heart,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Wifi,
  Waves,
  Utensils,
  Coffee,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface HotelCardProps {
  hotel: Hotel;
  isFavoriteInitial?: boolean;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel, isFavoriteInitial = false }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const [togglingFav, setTogglingFav] = useState(false);

  const coverUrl =
    hotel.coverImage ||
    hotel.images?.find((img) => img.isCover)?.url ||
    hotel.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

  const price = hotel.startingPrice || 350;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (togglingFav) return;
    setTogglingFav(true);

    try {
      const res = await api.post<{ success: boolean; isFavorite: boolean }>(`/users/favorites/${hotel.id}`);
      setIsFavorite(res.isFavorite);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setTogglingFav(false);
    }
  };

  return (
    <article className="royal-card rounded-[1.4rem] overflow-hidden flex flex-col group relative">
      {/* Visual Image Header */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        <img
          src={coverUrl}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        {/* Soft luxury cinematic gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#081220] via-transparent to-black/30"></div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          className={`liquid-glass absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
            isFavorite
              ? 'bg-rose-500 text-white hover:bg-rose-600 scale-105'
              : 'bg-black/40 hover:bg-black/60 text-white hover:text-rose-400 hover:scale-105'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Star Rating Badge */}
        <div className="liquid-glass-chip absolute top-4 left-4 px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-md border">
          <div className="flex text-amber-400">
            {Array.from({ length: hotel.starRating || 5 }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 ml-0.5 font-luxury">
            {hotel.starRating}-Star
          </span>
        </div>

        {/* Review rating score badge */}
        <div className="liquid-glass absolute bottom-4 right-4 px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-lg flex items-center space-x-1.5">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-white font-black">{hotel.averageRating ? hotel.averageRating.toFixed(1) : '5.0'}</span>
          <span className="text-slate-400 text-[10px] font-medium hidden sm:inline">
            ({hotel.reviewCount || 24})
          </span>
        </div>

        {/* Location badge */}
        <div className="absolute bottom-4 left-4 text-slate-200 flex items-center space-x-1.5 text-xs font-medium drop-shadow-md">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>{hotel.city}, {hotel.country}</span>
        </div>
      </div>

      {/* Property Details Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <Link to={`/hotels/${hotel.id}`}>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-950 group-hover:text-emerald-800 transition-colors line-clamp-1">
              {hotel.name}
            </h3>
          </Link>

          <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {hotel.description}
          </p>

          {/* Luxury Amenities Preview */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-4 text-slate-500 text-[11px]">
            <span className="flex items-center space-x-1 text-slate-600">
              <Waves className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pool & Spa</span>
            </span>
            <span className="flex items-center space-x-1 text-slate-600">
              <Utensils className="w-3.5 h-3.5 text-amber-700" />
              <span>Fine Dining</span>
            </span>
            <span className="flex items-center space-x-1 text-slate-600">
              <Wifi className="w-3.5 h-3.5 text-sky-700" />
              <span>Concierge WiFi</span>
            </span>
          </div>
        </div>

        {/* Pricing & CTA Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block font-luxury">
              Starting from
            </span>
            <div className="flex items-baseline space-x-1">
              <span className="font-serif text-2xl font-bold text-brand-950">
                {formatCurrency(price)}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ night</span>
            </div>
          </div>

          <Link
            to={`/hotels/${hotel.id}`}
            className="royal-gold-button liquid-glass-button inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 shadow-sm"
          >
            <span>View Suites</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};
