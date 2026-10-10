import React, { useState } from 'react';
import { 
  X, 
  Send, 
  DollarSign, 
  MapPin, 
  Store, 
  User, 
  Phone, 
  MessageSquare,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Medicine } from '../../types/medicine';
import { medicineService } from '../../services/medicineService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface PriceReportModalProps {
  medicine: Medicine | null;
  onClose: () => void;
}

export const PriceReportModal: React.FC<PriceReportModalProps> = ({
  medicine,
  onClose
}) => {
  const { user } = useAuth();
  const [newPrice, setNewPrice] = useState<string>('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [location, setLocation] = useState('পুঠিয়া বাজার');
  const [comment, setComment] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!medicine) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('সঠিক দাম উল্লেখ করুন');
      return;
    }

    setIsSubmitting(true);
    try {
      await medicineService.submitPriceReport({
        medicineId: medicine.id,
        brandName: medicine.brandName,
        genericName: medicine.genericName,
        reportedUnitPrice: parsedPrice,
        pharmacyName: pharmacyName.trim() || undefined,
        location: location.trim() || undefined,
        comment: comment.trim() || undefined,
        reportedBy: user?.uid,
        reporterName: user?.displayName || 'স্থানীয় নাগরিক',
        reporterPhone: reporterPhone.trim() || undefined
      });
      toast.success('ধন্যবাদ! আপনার দেওয়া দামের তথ্যটি যাচাইয়ের জন্য জমা দেওয়া হয়েছে।');
      onClose();
    } catch (err) {
      toast.error('তথ্য জমা দিতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-base font-black">ওষুধের সঠিক দাম জানান</h3>
              <p className="text-[11px] text-amber-100 font-bold">{medicine.brandName} ({medicine.strength})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              বর্তমান তালিকাভুক্ত দাম: <span className="font-black text-amber-950">৳{medicine.unitPrice}</span> (প্রতি পিস)। আপনি ফার্মেসি বা দোকানে আলাদা দাম পেয়ে থাকলে নিচে সঠিক দাম উল্লেখ করুন।
            </p>
          </div>

          {/* New Price Input */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              আপনি কত দামে কিনেছেন? (প্রতি পিস মূল্য ৳)*
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">৳</span>
              <input
                type="number"
                step="0.01"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="যেমন: 3.50"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Pharmacy Name */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              ফার্মেসি বা দোকানের নাম (ঐচ্ছিক)
            </label>
            <div className="relative">
              <Store size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                placeholder="যেমন: বিসমিল্লাহ ফার্মেসি"
                className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              এলাকা / বাজারের নাম
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="যেমন: পুঠিয়া বাজার"
                className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              আপনার মোবাইল নম্বর (যাচাইয়ের সুবিধার্থে - ঐচ্ছিক)
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer min-h-[44px]"
            >
              <Send size={15} />
              <span>{isSubmitting ? 'জমা হচ্ছে...' : 'দাম জমা দিন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
