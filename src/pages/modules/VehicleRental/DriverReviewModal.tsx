import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Star, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  ShieldCheck, 
  Clock, 
  Heart, 
  Sparkles, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Car, 
  Send 
} from 'lucide-react';
import { Vehicle, VehicleReview } from './types';
import { submitDriverReview } from '../../../services/vehicleReviewService';
import { toast } from 'sonner';

interface DriverReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  driverName?: string;
  driverPhone?: string;
  prefillRoute?: string;
  prefillDate?: string;
  onReviewSubmitted?: (review: VehicleReview) => void;
}

const RATING_DESCRIPTIONS: { [key: number]: string } = {
  1: 'অসন্তোষজনক (Very Poor)',
  2: 'মোটামুটি (Below Average)',
  3: 'ভালো (Good)',
  4: 'খুব ভালো (Very Good)',
  5: 'অসাধারণ ও চমৎকার (Excellent)'
};

const DEFAULT_FEEDBACK_TAGS = [
  '🛡️ নিরাপদ ড্রাইভিং',
  '⏱️ সময়মতো পৌঁছেছেন',
  '🤝 অমায়িক ও বিনয়ী চালক',
  '💰 ন্যায্য ভাড়া নিয়েছেন',
  '🧼 পরিষ্কার-পরিচ্ছন্ন গাড়ি',
  '🧭 পুঠিয়ার সকল রুট চেনা',
  '⚡ দ্রুত ও সতর্ক চালনা',
  '👨‍👩‍👧 পরিবারের জন্য নিরাপদ',
  '📦 মালামাল লোডিংয়ে সাহায্য'
];

export const DriverReviewModal: React.FC<DriverReviewModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  driverName,
  driverPhone,
  prefillRoute = '',
  prefillDate = '',
  onReviewSubmitted
}) => {
  const effectiveDriverName = driverName || vehicle?.driverInfo?.name || vehicle?.provider?.name || 'চালক';
  const effectiveDriverPhone = driverPhone || vehicle?.driverInfo?.phone || vehicle?.provider?.phone;

  // Star Ratings State
  const [overallRating, setOverallRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [safetyRating, setSafetyRating] = useState<number>(5);
  const [punctualityRating, setPunctualityRating] = useState<number>(5);
  const [behaviorRating, setBehaviorRating] = useState<number>(5);
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5);

  // Tags & Recommendation
  const [selectedTags, setSelectedTags] = useState<string[]>([
    '🛡️ নিরাপদ ড্রাইভিং',
    '⏱️ সময়মতো পৌঁছেছেন'
  ]);
  const [recommended, setRecommended] = useState<boolean>(true);

  // Ride & User Info
  const [rideRoute, setRideRoute] = useState<string>(prefillRoute);
  const [rideDate, setRideDate] = useState<string>(prefillDate || new Date().toISOString().split('T')[0]);
  const [farePaid, setFarePaid] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [userName, setUserName] = useState<string>(() => {
    try {
      const user = localStorage.getItem('user_profile');
      return user ? JSON.parse(user).fullName || '' : '';
    } catch {
      return '';
    }
  });
  const [userPhone, setUserPhone] = useState<string>(() => {
    try {
      const user = localStorage.getItem('user_profile');
      return user ? JSON.parse(user).phone || '' : '';
    } catch {
      return '';
    }
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !vehicle) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName.trim()) {
      toast.error('দয়া করে আপনার নাম প্রদান করুন');
      return;
    }

    if (!comment.trim() && selectedTags.length === 0) {
      toast.error('দয়া করে চালকের অভিজ্ঞতা নিয়ে কিছু লিখুন বা অন্তত একটি ট্যাগ নির্বাচন করুন');
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewPayload: Omit<VehicleReview, 'id' | 'createdAt'> = {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        driverName: effectiveDriverName,
        driverPhone: effectiveDriverPhone,
        userName: userName.trim(),
        userPhone: userPhone.trim(),
        userAvatar: '/logo.svg',
        rating: overallRating,
        driverRating: overallRating,
        safetyRating,
        punctualityRating,
        behaviorRating,
        cleanlinessRating,
        date: new Date().toLocaleDateString('bn-BD', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        rideDate: rideDate || new Date().toISOString().split('T')[0],
        rideRoute: rideRoute.trim() || `${vehicle.location?.union || 'পুঠিয়া'} এলাকা`,
        farePaid: farePaid.trim() || undefined,
        feedbackTags: selectedTags,
        recommended,
        verifiedRide: true,
        comment: comment.trim() || `${effectiveDriverName} ভাইয়ের সাথে ভ্রমণ বেশ ভালো ছিল।`
      };

      const result = await submitDriverReview(reviewPayload);
      toast.success('ড্রাইভারের রেটিং ও রিভিউ সফলভাবে সংরক্ষিত হয়েছে! ধন্যবাদ আপনার মতামতের জন্য।');

      if (onReviewSubmitted) {
        onReviewSubmitted(result);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('রিভিউ সাবমিট করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[140] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#006a4e] text-white flex items-center justify-center shadow-xs">
                <Star size={20} className="fill-amber-300 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  চালকের রেটিং ও রিভিউ
                </h3>
                <p className="text-[11px] font-bold text-slate-500">
                  আপনার ভ্রমণের সত্য অভিজ্ঞতা অন্যদের জানাতে সাহায্য করুন
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition border-none cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            
            {/* Driver & Vehicle Summary Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-emerald-100 border border-emerald-200 overflow-hidden shrink-0 flex items-center justify-center">
                <img 
                  src={vehicle.imageUrl || '/logo.svg'} 
                  alt={vehicle.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black bg-[#006a4e] text-white px-2 py-0.5 rounded-full">
                    {vehicle.typeLabel}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {vehicle.location?.union || 'পুঠিয়া'}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5">
                  {vehicle.name}
                </h4>
                <p className="text-xs font-bold text-emerald-800 flex items-center gap-1 truncate">
                  <span>👨‍✈️ চালক:</span>
                  <span className="underline">{effectiveDriverName}</span>
                  {effectiveDriverPhone && (
                    <span className="text-[11px] text-slate-500 font-mono">({effectiveDriverPhone})</span>
                  )}
                </p>
              </div>
            </div>

            {/* Overall Star Rating Box */}
            <div className="bg-gradient-to-b from-amber-50/60 to-white border border-amber-200/70 rounded-2xl p-4 text-center space-y-2">
              <label className="text-xs font-black text-slate-800 block">
                সামগ্রিক ভ্রমণ অভিজ্ঞতা কেমন ছিল?
              </label>

              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || overallRating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setOverallRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-slate-300 hover:scale-125 transition-transform border-none bg-transparent cursor-pointer"
                    >
                      <Star
                        size={32}
                        className={isFilled ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'text-slate-300'}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="text-xs font-extrabold text-amber-700">
                {RATING_DESCRIPTIONS[hoverRating || overallRating]}
              </div>
            </div>

            {/* Detailed Performance Metrics */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#006a4e]" />
                <span>চালকের নির্দিষ্ট মানদণ্ড মূল্যায়ন</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Safe Driving */}
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700">নিরাপদ ড্রাইভিং</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSafetyRating(s)}
                        className="text-xs border-none bg-transparent cursor-pointer p-0.5"
                      >
                        <Star size={14} className={safetyRating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Punctuality */}
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">সময়ানুবর্তিতা</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setPunctualityRating(s)}
                        className="text-xs border-none bg-transparent cursor-pointer p-0.5"
                      >
                        <Star size={14} className={punctualityRating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Driver Behavior */}
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Heart size={14} className="text-rose-500" />
                    <span className="text-xs font-bold text-slate-700">ব্যবহার ও সততা</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setBehaviorRating(s)}
                        className="text-xs border-none bg-transparent cursor-pointer p-0.5"
                      >
                        <Star size={14} className={behaviorRating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Cleanliness */}
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Car size={14} className="text-teal-600" />
                    <span className="text-xs font-bold text-slate-700">গাড়ির পরিচ্ছন্নতা</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setCleanlinessRating(s)}
                        className="text-xs border-none bg-transparent cursor-pointer p-0.5"
                      >
                        <Star size={14} className={cleanlinessRating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Feedback Tags */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                <span>প্রশংসা ও অভিজ্ঞতার ট্যাগসমূহ নির্বাচন করুন:</span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_FEEDBACK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all border cursor-pointer flex items-center gap-1 ${
                        isSelected 
                          ? 'bg-[#006a4e] text-white border-[#006a4e] shadow-xs' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ride Details (Route, Date, Fare) */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    ভ্রমণের রুট (কোথা থেকে কোথায়?)
                  </label>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="যেমন: পুঠিয়া সদর ➔ বানেশ্বর বাজার"
                      value={rideRoute}
                      onChange={(e) => setRideRoute(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#006a4e]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    ভ্রমণের তারিখ
                  </label>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={rideDate}
                      onChange={(e) => setRideDate(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#006a4e]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  প্রদত্ত ভাড়া (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ৳১৫০ বা ৳১,৫০০"
                  value={farePaid}
                  onChange={(e) => setFarePaid(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#006a4e]"
                />
              </div>
            </div>

            {/* Recommendation Question */}
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-black text-slate-900">অন্য যাত্রীদের সুপারিশ করবেন?</h5>
                <p className="text-[10px] font-bold text-slate-500">চালকের সেবা কি নির্ভরযোগ্য মনে হয়েছে?</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRecommended(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 border cursor-pointer ${
                    recommended 
                      ? 'bg-[#006a4e] text-white border-[#006a4e] shadow-xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ThumbsUp size={13} />
                  <span>হ্যাঁ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecommended(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 border cursor-pointer ${
                    !recommended 
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ThumbsDown size={13} />
                  <span>না</span>
                </button>
              </div>
            </div>

            {/* Review Comment Box */}
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-800 block">
                আপনার বিস্তারিত মন্তব্য ও ড্রাইভারের আচরণ:
              </label>
              <textarea
                rows={3}
                placeholder="ড্রাইভারের ব্যবহার, সততা, গাড়ির কন্ডিশন ও ভ্রমণের সামগ্রিক অভিজ্ঞতা সম্পর্কে লিখুন..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#006a4e] focus:bg-white resize-none"
              />
            </div>

            {/* User Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  আপনার নাম *
                </label>
                <div className="relative">
                  <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="আপনার নাম"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#006a4e] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  মোবাইল নম্বর (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#006a4e] focus:bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-[#006a4e] hover:bg-[#00543e] active:scale-[0.99] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer border-none disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>সাবমিট হচ্ছে...</span>
                  </span>
                ) : (
                  <>
                    <Send size={16} />
                    <span>রিভিউ ও রেটিং সম্পন্ন করুন</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
