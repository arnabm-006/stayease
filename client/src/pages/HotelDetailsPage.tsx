import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { hotelService } from '../services/hotelService';
import { Hotel, RoomType } from '../types';
import { RoomCard } from '../components/RoomCard';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  Star,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Clock,
  Sparkles,
  Wifi,
  Coffee,
  Waves,
  Heart,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  CheckCircle2,
  Bed,
  Maximize2,
  Car,
  Utensils,
  Dumbbell,
  Shield,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const HotelDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Availability query state
  const getDefaultDates = () => {
    const today = new Date();
    const inD = new Date(today);
    inD.setDate(today.getDate() + 1);
    const outD = new Date(today);
    outD.setDate(today.getDate() + 4);
    return {
      in: inD.toISOString().slice(0, 10),
      out: outD.toISOString().slice(0, 10),
    };
  };

  const defaults = getDefaultDates();
  const [checkInDate, setCheckInDate] = useState(defaults.in);
  const [checkOutDate, setCheckOutDate] = useState(defaults.out);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [activeTab, setActiveTab] = useState<'suites' | 'amenities' | 'policies' | 'reviews'>('suites');

  // Compute nights
  const calculateNights = (inDate: string, outDate: string) => {
    const d1 = new Date(inDate);
    const d2 = new Date(outDate);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };
  const stayNights = calculateNights(checkInDate, checkOutDate);

  useEffect(() => {
    async function loadHotel() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await hotelService.getHotelDetails(id);
        setHotel(res.data.hotel);
        refreshAvailability(res.data.hotel.id);
      } catch (err: any) {
        setError(err?.message || 'Hotel details could not be loaded.');
      } finally {
        setLoading(false);
      }
    }

    loadHotel();
  }, [id]);

  const refreshAvailability = async (hotelId?: string) => {
    const targetId = hotelId || hotel?.id;
    if (!targetId) return;

    setCheckingAvailability(true);
    try {
      const res = await hotelService.checkAvailability(
        targetId,
        checkInDate,
        checkOutDate,
        guests,
        rooms
      );
      const map: Record<string, number> = {};
      res.data?.availability?.forEach((a: any) => {
        map[a.roomTypeId] = a.availableRooms;
      });
      setAvailability(map);
    } catch (err) {
      console.error('Availability check failed:', err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSelectRoom = (roomType: RoomType) => {
    const query = new URLSearchParams({
      hotelId: hotel!.id,
      roomTypeId: roomType.id,
      checkInDate,
      checkOutDate,
      roomQuantity: String(rooms),
      guests: String(guests),
    });

    navigate(`/checkout?${query.toString()}`);
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!hotel) return;

    try {
      const res = await api.post<{ success: boolean; isFavorite: boolean }>(`/users/favorites/${hotel.id}`);
      setIsFavorite(res.isFavorite);
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-brand-900 animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-500">Curating luxury hotel sanctuary details...</p>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="max-w-xl mx-auto my-24 p-8 rounded-3xl bg-white border border-slate-100 text-center shadow-card space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Hotel Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'The requested property could not be located.'}</p>
        <Link
          to="/hotels"
          className="inline-block px-6 py-2.5 rounded-xl bg-brand-900 text-white text-xs font-bold"
        >
          Browse All Hotels
        </Link>
      </div>
    );
  }

  const galleryImages = hotel.images && hotel.images.length > 0
    ? hotel.images.map((img) => img.url)
    : [hotel.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80'];

  const activePhoto = galleryImages[selectedPhotoIndex] || galleryImages[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
            <Link to="/" className="hover:text-brand-900 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/hotels" className="hover:text-brand-900 transition-colors">Hotels</Link>
            <span>/</span>
            <span className="text-slate-700 font-bold">{hotel.city}</span>
          </div>
          <div className="flex items-center space-x-3 pt-1">
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-900">
              {hotel.name}
            </h1>
            <div className="flex text-amber-400">
              {Array.from({ length: hotel.starRating || 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
            </span>
            <span className="flex items-center space-x-1 text-brand-900 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full">
              <span className="text-amber-500">★</span>
              <span>{hotel.averageRating ? hotel.averageRating.toFixed(1) : '5.0'}</span>
              <span className="text-slate-400 font-normal">({hotel.reviewCount || 1} verified reviews)</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleShare}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
          </button>
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`px-4 py-2 rounded-xl border text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-colors ${
              isFavorite
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current text-rose-500' : ''}`} />
            <span>{isFavorite ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Gallery Showcase */}
      <div className="space-y-4">
        <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden bg-slate-900 shadow-elevated group">
          <img
            src={activePhoto}
            alt={hotel.name}
            className="w-full h-full object-cover transition-all duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

          {/* Navigation Arrows */}
          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedPhotoIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Photo Count & Fullscreen trigger */}
          <div className="absolute bottom-6 right-6 flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="px-4 py-2 rounded-full bg-white/95 hover:bg-white text-brand-900 text-xs font-bold shadow-lg backdrop-blur-md transition-transform hover:scale-105"
            >
              View Full Gallery ({galleryImages.length} Photos)
            </button>
          </div>
        </div>

        {/* Thumbnails row */}
        {galleryImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPhotoIndex(idx)}
                className={`relative w-28 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                  selectedPhotoIndex === idx
                    ? 'border-brand-900 ring-2 ring-brand-900/20 scale-105'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Details Left, Stay Booking Bar Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Description, Tabs, Suites & Amenities */}
        <div className="lg:col-span-8 space-y-10">
          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-slate-200 gap-8 text-sm font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('suites')}
              className={`pb-3 transition-colors relative ${
                activeTab === 'suites' ? 'text-brand-900 border-b-2 border-brand-900' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Suites & Rooms ({hotel.roomTypes?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('amenities')}
              className={`pb-3 transition-colors relative ${
                activeTab === 'amenities' ? 'text-brand-900 border-b-2 border-brand-900' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Amenities & Services
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('policies')}
              className={`pb-3 transition-colors relative ${
                activeTab === 'policies' ? 'text-brand-900 border-b-2 border-brand-900' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Policies & Location
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 transition-colors relative ${
                activeTab === 'reviews' ? 'text-brand-900 border-b-2 border-brand-900' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Guest Reviews ({hotel.reviews?.length || 1})
            </button>
          </div>

          {/* Hotel Description Highlight */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-subtle space-y-4">
            <h3 className="font-serif text-2xl font-bold text-brand-900">About the Sanctuary</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-light">
              {hotel.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-3 text-xs">
                <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Check-In</span>
                  <span className="font-bold text-slate-800">{hotel.checkInTime || '15:00'} Onwards</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Check-Out</span>
                  <span className="font-bold text-slate-800">By {hotel.checkOutTime || '11:00'}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cancellation</span>
                  <span className="font-bold text-slate-800">Flexible 48-Hour Guarantee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab 1: Available Suites & Rooms */}
          {activeTab === 'suites' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-brand-900">Available Suites</h3>
                  <p className="text-xs text-slate-500">
                    Live availability verified for {formatDate(checkInDate)} &mdash; {formatDate(checkOutDate)} ({stayNights} Nights)
                  </p>
                </div>
                {checkingAvailability && (
                  <span className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-bold animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking inventory...</span>
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {hotel.roomTypes?.map((roomType) => {
                  const availableCount = availability[roomType.id];
                  const stayTotal = Number(roomType.basePrice) * stayNights;

                  return (
                    <div
                      key={roomType.id}
                      className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card hover:shadow-elevated transition-all duration-300 p-6 flex flex-col md:flex-row gap-6"
                    >
                      <div className="w-full md:w-64 h-52 md:h-auto rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative">
                        <img
                          src={roomType.imageUrl || 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80'}
                          alt={roomType.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-sm bg-emerald-500/95 text-white">
                          {availableCount !== undefined ? `${availableCount} Available` : 'Available'}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-start justify-between">
                            <h4 className="font-serif text-2xl font-bold text-brand-900">
                              {roomType.name}
                            </h4>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {roomType.description}
                          </p>

                          <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                            <span className="flex items-center space-x-1 font-semibold">
                              <Users className="w-4 h-4 text-emerald-600" />
                              <span>Max {roomType.maxOccupancy} Guests</span>
                            </span>
                            <span className="flex items-center space-x-1 font-semibold">
                              <Bed className="w-4 h-4 text-emerald-600" />
                              <span>{roomType.bedConfig || '1 King Bed'}</span>
                            </span>
                            <span className="flex items-center space-x-1 font-semibold">
                              <Maximize2 className="w-4 h-4 text-emerald-600" />
                              <span>{roomType.roomSizeSqFt || 550} Sq Ft</span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <div className="flex items-baseline space-x-1">
                              <span className="text-2xl font-extrabold text-brand-900">
                                {formatCurrency(Number(roomType.basePrice))}
                              </span>
                              <span className="text-xs text-slate-500">/ night</span>
                            </div>
                            <span className="text-[11px] text-emerald-700 font-bold block">
                              Total: {formatCurrency(stayTotal)} for {stayNights} nights
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectRoom(roomType)}
                            className="px-6 py-3 rounded-2xl bg-brand-900 hover:bg-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                          >
                            <span>Reserve Suite</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Amenities */}
          {activeTab === 'amenities' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-subtle space-y-6">
              <h3 className="font-serif text-2xl font-bold text-brand-900">Sanctuary Amenities & Privileges</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {hotel.amenities?.map((a, idx) => (
                  <div key={idx} className="flex items-start space-x-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{a.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{a.description || 'Complimentary luxury amenity provided during your stay.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Policies & Location */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-subtle space-y-4">
                <h3 className="font-serif text-2xl font-bold text-brand-900">Hotel Policies</h3>
                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <p><strong>Cancellation:</strong> {hotel.cancellationPolicy || 'Complimentary cancellation up to 48 hours prior to arrival date.'}</p>
                  <p><strong>Check-in Requirement:</strong> Government-issued photo identification and security credit card authorization required at reception.</p>
                  <p><strong>Children & Extra Beds:</strong> Children under 12 stay complimentary with parents using existing bedding.</p>
                  <p><strong>Pet Policy:</strong> Service animals welcomed. Custom pet concierge amenities available on prior request.</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-subtle space-y-4">
                <h3 className="font-serif text-2xl font-bold text-brand-900">Location & Surroundings</h3>
                <p className="text-xs text-slate-500">
                  {hotel.address}, {hotel.city}, {hotel.state ? `${hotel.state}, ` : ''}{hotel.country}
                </p>
                <div className="w-full h-56 rounded-2xl bg-slate-100 overflow-hidden relative flex items-center justify-center border border-slate-200">
                  <div className="text-center p-6 space-y-2">
                    <MapPin className="w-8 h-8 text-emerald-600 mx-auto" />
                    <span className="font-bold text-sm text-slate-800">{hotel.name}</span>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Coordinates: {hotel.latitude || '25.7617'}° N, {hotel.longitude || '-80.1918'}° W. Airport chauffeur service available.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Reviews */}
          {activeTab === 'reviews' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-subtle space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-brand-900">Verified Guest Reviews</h3>
                  <p className="text-xs text-slate-500 mt-1">Authentic experiences submitted by verified patrons.</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-2xl font-black text-brand-900 justify-end">
                    <span className="text-amber-500">★</span>
                    <span>{hotel.averageRating ? hotel.averageRating.toFixed(1) : '5.0'}</span>
                    <span className="text-sm font-normal text-slate-400">/ 5.0</span>
                  </div>
                  <span className="text-xs text-slate-500">{hotel.reviewCount || 1} Total Reviews</span>
                </div>
              </div>

              <div className="space-y-4">
                {hotel.reviews && hotel.reviews.length > 0 ? (
                  hotel.reviews.map((rev) => (
                    <div key={rev.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{rev.title}</h4>
                          <span className="text-xs text-slate-400">
                            {rev.user ? `${rev.user.firstName} ${rev.user.lastName}` : 'Verified Guest'} &bull; {formatDate(rev.createdAt)}
                          </span>
                        </div>
                        <div className="flex text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-light">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No verified reviews published yet. Be the first to leave a review after your stay!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Sticky Booking & Availability Widget */}
        <div className="lg:col-span-4 sticky top-28 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-card space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Nightly Rates</span>
                <span className="text-2xl font-black text-brand-900">
                  {formatCurrency(hotel.startingPrice || 350)}
                </span>
                <span className="text-xs text-slate-500"> / night</span>
              </div>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">
                Instant Hold
              </span>
            </div>

            {/* Date Picker Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Check-In</label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => {
                      setCheckInDate(e.target.value);
                      refreshAvailability();
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-900/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Check-Out</label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => {
                      setCheckOutDate(e.target.value);
                      refreshAvailability();
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-900/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Guests</label>
                  <select
                    value={guests}
                    onChange={(e) => {
                      setGuests(Number(e.target.value));
                      refreshAvailability();
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-900/20"
                  >
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <option key={g} value={g}>{g} {g === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Rooms</label>
                  <select
                    value={rooms}
                    onChange={(e) => {
                      setRooms(Number(e.target.value));
                      refreshAvailability();
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-900/20"
                  >
                    {[1, 2, 3, 4].map((r) => (
                      <option key={r} value={r}>{r} {r === 1 ? 'Room' : 'Rooms'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => refreshAvailability()}
                disabled={checkingAvailability}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-900 text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingAvailability ? 'animate-spin' : ''}`} />
                <span>{checkingAvailability ? 'Verifying Availability...' : 'Refresh Availability'}</span>
              </button>
            </div>

            {/* Quick Guarantees */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero reservation hold fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Best rate match guarantee</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified luxury property standards</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-6 animate-fade-in">
          <div className="flex items-center justify-between text-white">
            <span className="font-serif text-lg font-bold">
              {hotel.name} &bull; Photo {selectedPhotoIndex + 1} of {galleryImages.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-6">
            <img
              src={galleryImages[selectedPhotoIndex]}
              alt={`Fullscreen ${selectedPhotoIndex + 1}`}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
            />
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedPhotoIndex((p) => (p > 0 ? p - 1 : galleryImages.length - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPhotoIndex((p) => (p < galleryImages.length - 1 ? p + 1 : 0))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <div className="flex justify-center gap-2 overflow-x-auto pb-2">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPhotoIndex(idx)}
                className={`w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  selectedPhotoIndex === idx ? 'border-emerald-500 scale-105' : 'border-transparent opacity-50'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
