import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { hotelService } from '../services/hotelService';
import { Hotel } from '../types';
import { HotelCard } from '../components/HotelCard';
import { SearchForm } from '../components/SearchForm';
import {
  SlidersHorizontal,
  Star,
  DollarSign,
  Sparkles,
  MapPin,
  RefreshCw,
  SearchX,
  X,
  LayoutGrid,
  List,
  Check,
} from 'lucide-react';

const COMMON_AMENITIES = [
  'Heated Infinity Pool',
  'Spa & Wellness Sanctuary',
  'Michelin-starred Dining',
  'Oceanview Balcony',
  'High-speed Wi-Fi',
  'Airport Chauffeur',
  'Valet Parking',
];

export const HotelSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const destination = searchParams.get('destination') || '';
  const checkInDate = searchParams.get('checkInDate') || '';
  const checkOutDate = searchParams.get('checkOutDate') || '';
  const guests = Number(searchParams.get('guests') || '2');
  const rooms = Number(searchParams.get('rooms') || '1');
  const starRating = searchParams.get('starRating') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const amenity = searchParams.get('amenity') || '';
  const sortBy = searchParams.get('sortBy') || 'popularity';
  const page = Number(searchParams.get('page') || '1');

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      setError(null);
      try {
        const res = await hotelService.searchHotels({
          destination,
          checkInDate,
          checkOutDate,
          guests,
          rooms,
          starRating: starRating ? Number(starRating) : undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          amenity: amenity || undefined,
          sortBy,
          page,
          limit: 9,
        });

        setHotels(res.data?.hotels || []);
        setTotal(res.data?.pagination?.total || 0);
        setTotalPages(res.data?.pagination?.totalPages || 1);
      } catch (err: any) {
        setError(err?.message || 'Failed to search hotels.');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [searchParams]);

  const updateFilter = (key: string, val: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (val) {
      nextParams.set(key, val);
    } else {
      nextParams.delete(key);
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const removeFilter = (key: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(key);
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams({ page: '1' }));
  };

  const hasActiveFilters = Boolean(
    destination || starRating || minPrice || maxPrice || amenity || sortBy !== 'popularity'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header and Search Modification Card */}
      <div className="space-y-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-900">
            {destination ? `Luxury Stays in "${destination}"` : 'All Luxury Sanctuaries'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {total} {total === 1 ? 'property' : 'properties'} available matching your criteria
          </p>
        </div>

        <SearchForm
          initialDestination={destination}
          initialCheckIn={checkInDate}
          initialCheckOut={checkOutDate}
          initialGuests={guests}
          initialRooms={rooms}
          compact={true}
        />
      </div>

      {/* Active Filter Pills Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Active Filters:</span>
          {destination && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
              <span>Destination: {destination}</span>
              <button type="button" onClick={() => removeFilter('destination')} className="hover:text-rose-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {starRating && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
              <span>{starRating} Stars & above</span>
              <button type="button" onClick={() => removeFilter('starRating')} className="hover:text-rose-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
              <span>Price: ${minPrice || '0'} - ${maxPrice || 'Any'}</span>
              <button
                type="button"
                onClick={() => {
                  removeFilter('minPrice');
                  removeFilter('maxPrice');
                }}
                className="hover:text-rose-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {amenity && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
              <span>Amenity: {amenity}</span>
              <button type="button" onClick={() => removeFilter('amenity')} className="hover:text-rose-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Grid: Filters + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-subtle space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span>Refine Search</span>
              </span>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-slate-400 hover:text-slate-700 font-medium"
              >
                Reset
              </button>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Sort Stays
              </label>
              <select
                value={sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="popularity">Most Popular & Recommended</option>
                <option value="rating_desc">Highest Guest Rating</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Star Rating
              </label>
              <div className="space-y-2">
                {['5', '4', '3'].map((rating) => (
                  <label
                    key={rating}
                    className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="starFilter"
                      checked={starRating === rating}
                      onChange={() => updateFilter('starRating', rating)}
                      className="rounded text-brand-900 focus:ring-brand-900"
                    />
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Number(rating) }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      <span>& above</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Nightly Rate (USD)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    placeholder="Min $"
                    value={minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Max $"
                    value={maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Popular Amenities Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Curated Amenities
              </label>
              <div className="space-y-2">
                {COMMON_AMENITIES.map((amen) => {
                  const isSelected = amenity === amen;
                  return (
                    <button
                      key={amen}
                      type="button"
                      onClick={() => updateFilter('amenity', isSelected ? '' : amen)}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span>{amen}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-subtle text-xs">
            <span className="text-slate-500 font-medium">
              Showing <strong className="text-slate-900">{hotels.length}</strong> of{' '}
              <strong className="text-slate-900">{total}</strong> luxury hotels
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-colors ${
                  viewMode === 'grid' ? 'bg-brand-900 text-white' : 'text-slate-400 hover:text-slate-700 bg-slate-100'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-colors ${
                  viewMode === 'list' ? 'bg-brand-900 text-white' : 'text-slate-400 hover:text-slate-700 bg-slate-100'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hotel Grid / List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card animate-pulse space-y-4 p-4"
                >
                  <div className="aspect-[16/10] bg-slate-200 rounded-2xl"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : hotels.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-subtle space-y-4">
              <SearchX className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-serif text-2xl font-bold text-slate-800">
                No matching sanctuaries found
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                We couldn&rsquo;t locate any properties matching your current filters. Try relaxing your dates, destination, or star rating.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-6 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold transition-all shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-6'
              }
            >
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-8">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNumber = idx + 1;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => updateFilter('page', String(pageNumber))}
                    className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                      page === pageNumber
                        ? 'bg-brand-900 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
