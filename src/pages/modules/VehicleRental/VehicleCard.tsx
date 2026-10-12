import React from 'react';
import { motion } from 'motion/react';
import { Heart, Share2, Phone, CheckCircle, MapPin, Star, Users, ArrowRight, ShieldCheck, Fuel, Car, Navigation, Shield } from 'lucide-react';
import { Vehicle } from './types';

interface VehicleCardProps {
  vehicle: Vehicle;
  savedIds?: string[];
  onToggleSave?: (id: string, e: React.MouseEvent) => void;
  onShare?: (vehicle: Vehicle, e: React.MouseEvent) => void;
  onSelect: (vehicle: Vehicle) => void;
  onOpenBooking?: (vehicle: Vehicle, e: React.MouseEvent) => void;
  onOpenReviewModal?: (vehicle: Vehicle, e: React.MouseEvent) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  savedIds = [],
  onToggleSave,
  onShare,
  onSelect,
  onOpenBooking,
  onOpenReviewModal
}) => {
  const isSaved = savedIds.includes(vehicle.id);
  const isVerified = vehicle.provider?.isVerified;

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = vehicle.provider?.phone || '01712345678';
    window.location.href = `tel:${phone}`;
  };

  // Determine main price string
  const displayPrice = () => {
    if (vehicle.pricing.daily) return `৳${vehicle.pricing.daily.toLocaleString('bn-BD')} / দিন`;
    if (vehicle.pricing.hourly) return `৳${vehicle.pricing.hourly.toLocaleString('bn-BD')} / ঘণ্টা`;
    if (vehicle.pricing.perKm) return `৳${vehicle.pricing.perKm.toLocaleString('bn-BD')} / কিমি`;
    return 'ভাড়া আলোচনা সাপেক্ষে';
  };

  const getDriverLabel = () => {
    if (vehicle.driverOption === 'with_driver') return '👨‍✈️ ড্রাইভারসহ';
    if (vehicle.driverOption === 'without_driver') return '🚗 ড্রাইভার ছাড়া';
    return '👨‍✈️ ড্রাইভারসহ/ছাড়া';
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={() => onSelect(vehicle)}
      className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md border border-slate-100/90 hover:border-emerald-200/80 transition-all cursor-pointer relative mb-3.5 space-y-3 group focus:outline-hidden focus:ring-2 focus:ring-[#006a4e]/40"
    >
      {/* Top Header Badges & Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isVerified ? (
            <span className="bg-emerald-50 text-[#006a4e] text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200/70 shadow-2xs">
              <CheckCircle size={11} className="fill-[#006a4e] text-white" />
              <span>✓ ভেরিফাইড প্রোভাইডার</span>
            </span>
          ) : (
            <span className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
              তালিকাভুক্ত
            </span>
          )}

          <span className="bg-slate-50 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200/80 flex items-center gap-1">
            <Car size={10} className="text-[#006a4e]" />
            <span>{vehicle.typeLabel}</span>
          </span>

          {vehicle.isAC && (
            <span className="bg-cyan-50 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-200/60 flex items-center gap-1">
              <span>❄️ এসি (AC)</span>
            </span>
          )}

          {vehicle.isFeatured && (
            <span className="bg-amber-500 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
              ★ ফিচারড
            </span>
          )}
        </div>

        {/* Favorite & Share Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {onShare && (
            <button
              onClick={(e) => onShare(vehicle, e)}
              title="শেয়ার করুন"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
            >
              <Share2 size={16} />
            </button>
          )}

          {onToggleSave && (
            <button
              onClick={(e) => onToggleSave(vehicle.id, e)}
              title={isSaved ? "সংরক্ষণ বাতিল" : "সংরক্ষণ করুন"}
              className="p-1.5 rounded-full transition-colors border-none bg-transparent cursor-pointer"
            >
              <Heart
                size={18}
                className={isSaved ? "fill-rose-500 text-rose-500" : "text-slate-400 hover:text-rose-500"}
              />
            </button>
          )}
        </div>
      </div>

      {/* Main Row: Thumbnail + Details */}
      <div className="flex gap-3.5 sm:gap-4 items-start">
        {/* Vehicle Image */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-slate-100/60 shrink-0 border border-slate-100/90 overflow-hidden relative shadow-2xs flex items-center justify-center group-hover:border-emerald-200 transition-colors">
          <img
            src={vehicle.imageUrl || '/logo.svg'}
            alt={vehicle.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/logo.svg';
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-1 right-1 bg-black/65 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
            <Users size={10} />
            <span>{vehicle.seatCapacity} সিট</span>
          </div>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#006a4e] transition-colors leading-snug line-clamp-1">
            {vehicle.name}
          </h3>

          <p className="text-xs text-slate-600 font-medium leading-tight truncate">
            🏢 {vehicle.provider?.businessName || vehicle.provider?.name}
          </p>

          {/* Driver Info & Rating Badge */}
          {vehicle.driverInfo?.name && (
            <p className="text-[11px] font-bold text-[#006a4e] flex items-center gap-1 leading-tight truncate">
              <span>👨‍✈️ চালক: {vehicle.driverInfo.name}</span>
              <span className="text-amber-600 font-extrabold">({vehicle.driverInfo.rating || 4.8}★)</span>
            </p>
          )}

          <p className="text-xs text-slate-500 flex items-center gap-1 leading-tight truncate pt-0.5">
            <MapPin size={12} className="text-[#006a4e] shrink-0" />
            <span className="truncate">{vehicle.location?.address || `${vehicle.location?.union}, পুঠিয়া`}</span>
          </p>

          {/* Key Features Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-medium text-slate-600">
            <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100/90 text-slate-700">
              {getDriverLabel()}
            </span>
            <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100/90 text-slate-700">
              ⛽ {vehicle.fuelType}
            </span>
          </div>

          {/* Rating & Pricing Row */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-2">
            <div className="flex items-center gap-1 text-xs">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span className="font-bold text-amber-600">{vehicle.rating}</span>
              <span className="text-slate-400 text-[11px]">({vehicle.reviewCount} রিভিউ)</span>
            </div>

            <div className="text-right">
              <span className="text-xs sm:text-sm font-extrabold text-[#006a4e]">
                {displayPrice()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Services offered list preview */}
      {vehicle.serviceArea && vehicle.serviceArea.length > 0 && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-bold text-slate-400">কভারেজ:</span>
          {vehicle.serviceArea.slice(0, 3).map((area, idx) => (
            <span key={idx} className="bg-emerald-50/70 text-[#006a4e] text-[10px] font-medium px-2 py-0.5 rounded-md border border-emerald-100/60">
              {area}
            </span>
          ))}
          {vehicle.serviceArea.length > 3 && (
            <span className="text-[10px] text-slate-400 font-medium">+{vehicle.serviceArea.length - 3}টি এলাকা</span>
          )}
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-slate-100/90">
        <button
          type="button"
          onClick={handleCall}
          className="py-2.5 px-2 bg-slate-50/80 hover:bg-slate-100 active:scale-97 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#006a4e]/20"
        >
          <Phone size={13} className="text-[#006a4e] shrink-0" />
          <span>কল করুন</span>
        </button>

        {onOpenBooking ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenBooking(vehicle, e);
            }}
            className="py-2.5 px-2 bg-amber-50/80 hover:bg-amber-100 active:scale-97 text-amber-800 font-bold text-xs rounded-xl border border-amber-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <span>📅 বুকিং</span>
          </button>
        ) : null}

        {onOpenReviewModal ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenReviewModal(vehicle, e);
            }}
            title="ড্রাইভারকে রেটিং ও রিভিউ দিন"
            className="py-2.5 px-2 bg-emerald-50/80 hover:bg-emerald-100 active:scale-97 text-[#006a4e] font-bold text-xs rounded-xl border border-emerald-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <Star size={13} className="fill-amber-400 text-amber-500 shrink-0" />
            <span>রেটিং দিন</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => onSelect(vehicle)}
          className="py-2.5 px-2 bg-[#006a4e] hover:bg-[#00543e] active:scale-97 text-white font-black text-xs rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-1 border-none cursor-pointer group-hover:bg-[#00543e] focus:outline-hidden focus:ring-2 focus:ring-[#006a4e]/40"
        >
          <span>বিস্তারিত</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </motion.article>
  );
};

export default VehicleCard;
