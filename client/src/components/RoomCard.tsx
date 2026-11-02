import React from 'react';
import { RoomType } from '../types';
import { formatCurrency } from '../lib/utils';
import { Users, Bed, Maximize2, Check, AlertCircle } from 'lucide-react';

interface RoomCardProps {
  roomType: RoomType;
  availableCount?: number | null;
  onSelect: (roomType: RoomType) => void;
  selected?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  roomType,
  availableCount,
  onSelect,
  selected = false,
}) => {
  const isAvailable = availableCount === undefined || availableCount === null || availableCount > 0;

  return (
    <div
      className={`bg-white rounded-3xl overflow-hidden border transition-all duration-300 p-6 flex flex-col md:flex-row gap-6 ${
        selected
          ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-elevated'
          : 'border-slate-100 shadow-subtle hover:shadow-card'
      }`}
    >
      {/* Image */}
      <div className="w-full md:w-64 h-48 md:h-auto rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative">
        <img
          src={
            roomType.imageUrl ||
            'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80'
          }
          alt={roomType.name}
          className="w-full h-full object-cover"
        />
        {availableCount !== undefined && availableCount !== null && (
          <div
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-sm ${
              availableCount > 0
                ? 'bg-emerald-500/90 text-white'
                : 'bg-rose-500/90 text-white'
            }`}
          >
            {availableCount > 0 ? `${availableCount} Available` : 'Fully Booked'}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <h4 className="font-serif text-xl font-bold text-brand-900 mb-2">
              {roomType.name}
            </h4>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
            {roomType.description}
          </p>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 mb-4 text-slate-600 text-xs">
            <div className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Up to {roomType.maxOccupancy} Guests</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Bed className="w-4 h-4 text-brand-700" />
              <span className="truncate">{roomType.bedConfig}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Maximize2 className="w-4 h-4 text-slate-400" />
              <span>{roomType.roomSizeSqFt} sq ft</span>
            </div>
          </div>
        </div>

        {/* Pricing and Action */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-extrabold text-brand-900">
                {formatCurrency(roomType.basePrice)}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ night</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold block">
              Taxes and resort fees calculated at checkout
            </span>
          </div>

          <button
            onClick={() => onSelect(roomType)}
            disabled={!isAvailable}
            className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 ${
              !isAvailable
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : selected
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-brand-900 hover:bg-brand-800 text-white shadow-sm hover:shadow-md'
            }`}
          >
            {selected ? (
              <>
                <Check className="w-4 h-4" />
                <span>Selected</span>
              </>
            ) : !isAvailable ? (
              <span>Sold Out</span>
            ) : (
              <span>Select Suite</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
