import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Bookmark, 
  Check, 
  AlertTriangle, 
  Info, 
  Calculator, 
  ArrowRight, 
  Clock, 
  Building2, 
  Pill, 
  DollarSign, 
  ShieldCheck, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Medicine } from '../../types/medicine';
import { toast } from 'sonner';

interface MedicineDetailsModalProps {
  medicine: Medicine | null;
  alternatives: Medicine[];
  onClose: () => void;
  onSelectAlternative: (med: Medicine) => void;
  onOpenCalculatorWithMed: (med: Medicine) => void;
  onOpenPriceReport: (med: Medicine) => void;
}

export const MedicineDetailsModal: React.FC<MedicineDetailsModalProps> = ({
  medicine,
  alternatives,
  onClose,
  onSelectAlternative,
  onOpenCalculatorWithMed,
  onOpenPriceReport
}) => {
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(() => {
    if (!medicine) return false;
    const savedList = JSON.parse(localStorage.getItem('saved_medicines_ids') || '[]');
    return savedList.includes(medicine.id);
  });

  if (!medicine) return null;

  const toBengaliNumber = (num: number = 0) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toFixed(2).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)]);
  };

  const handleToggleSave = () => {
    const savedList: string[] = JSON.parse(localStorage.getItem('saved_medicines_ids') || '[]');
    let updated: string[];
    if (savedList.includes(medicine.id)) {
      updated = savedList.filter(id => id !== medicine.id);
      setIsSaved(false);
      toast.info('সংরক্ষণ থেকে সরানো হয়েছে');
    } else {
      updated = [...savedList, medicine.id];
      setIsSaved(true);
      toast.success('ওষুধটি আপনার তালিকায় সংরক্ষিত হয়েছে');
    }
    localStorage.setItem('saved_medicines_ids', JSON.stringify(updated));
  };

  const handleShare = () => {
    const text = `${medicine.brandName} (${medicine.strength}) - ${medicine.genericName}\nদাম: ৳${medicine.unitPrice} (প্রতি পিস)\nপ্রস্তুতকারক: ${medicine.manufacturer}\nআমাদের পুঠিয়া অ্যাপে দেখুন।`;
    if (navigator.share) {
      navigator.share({ title: medicine.brandName, text });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('তথ্য কপি করা হয়েছে!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg max-h-[90vh] rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 to-teal-50/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
              <Pill size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-800 leading-none">
                  {medicine.brandName} <span className="text-emerald-700 text-sm font-extrabold">{medicine.strength}</span>
                </h3>
              </div>
              <p className="text-xs font-bold text-slate-500 mt-1">
                {medicine.genericName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleSave}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isSaved ? 'bg-amber-100 text-amber-600' : 'hover:bg-black/5 text-slate-500'
              }`}
              title="বুকমার্ক করুন"
            >
              <Bookmark size={18} className={isSaved ? 'fill-current' : ''} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-black/5 text-slate-500 transition-all cursor-pointer"
              title="শেয়ার করুন"
            >
              {copied ? <Check size={18} className="text-emerald-600" /> : <Share2 size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 text-slate-500 transition-all cursor-pointer"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-slate-700">
          
          {/* Price Box */}
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-4.5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-200 tracking-wide uppercase">খুচরা বিক্রয় মূল্য (MRP)</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-black text-white">৳{toBengaliNumber(medicine.unitPrice)}</span>
                  <span className="text-xs font-bold text-emerald-300">/ প্রতি পিস</span>
                </div>
                {medicine.packSizeText && (
                  <p className="text-xs font-semibold text-emerald-200/90 mt-1">
                    প্যাক: {medicine.packSizeText}
                  </p>
                )}
              </div>

              <button
                onClick={() => onOpenCalculatorWithMed(medicine)}
                className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition active:scale-95 shrink-0"
              >
                <Calculator size={16} />
                <span>বিলের হিসাব</span>
              </button>
            </div>
            
            {/* Last updated tag */}
            <div className="relative z-10 flex items-center justify-between mt-3 pt-2.5 border-t border-white/10 text-[10px] text-emerald-200">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                হালনাগাদ: {medicine.lastUpdated || 'চলতি মাস'}
              </span>
              <button
                onClick={() => onOpenPriceReport(medicine)}
                className="text-amber-300 hover:underline font-bold cursor-pointer"
              >
                ভুল দাম? দাম জানান ↗
              </button>
            </div>
          </div>

          {/* Quick Specifications */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400">প্রস্তুতকারক কোম্পানি</span>
              <span className="text-xs font-black text-slate-800 mt-0.5 flex items-center gap-1 truncate">
                <Building2 size={13} className="text-emerald-600 shrink-0" />
                {medicine.manufacturer}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400">ওষুধের ধরন (Form)</span>
              <span className="text-xs font-black text-slate-800 mt-0.5 flex items-center gap-1">
                <Layers size={13} className="text-teal-600 shrink-0" />
                {medicine.dosageFormBn} ({medicine.strength})
              </span>
            </div>
          </div>

          {/* Indications (কী কী সমস্যায় সেবনীয়) */}
          {medicine.indications && (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <Info size={15} className="text-emerald-600" />
                <span>যেসব সমস্যায় নির্দেশিত (Indications)</span>
              </div>
              <p className="text-xs font-medium text-slate-600 leading-relaxed pl-5">
                {medicine.indications}
              </p>
            </div>
          )}

          {/* Dosage & Administration (সেবন বিধি) */}
          {medicine.dosageInstruction && (
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                <Clock size={15} className="text-emerald-700" />
                <span>সাধারণ সেবন বিধি ও মাত্রা (Dosage)</span>
              </div>
              <p className="text-xs font-medium text-emerald-800 leading-relaxed pl-5">
                {medicine.dosageInstruction}
              </p>
            </div>
          )}

          {/* Side effects & Precautions */}
          <div className="space-y-2">
            {medicine.sideEffects && (
              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100 text-xs">
                <span className="font-black text-amber-900 flex items-center gap-1 mb-1">
                  <AlertTriangle size={13} className="text-amber-600" />
                  পার্শ্বপ্রতিক্রিয়া:
                </span>
                <p className="text-amber-800 font-medium leading-relaxed pl-4">
                  {medicine.sideEffects}
                </p>
              </div>
            )}
            {medicine.precautions && (
              <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-100 text-xs">
                <span className="font-black text-rose-900 flex items-center gap-1 mb-1">
                  <ShieldCheck size={13} className="text-rose-600" />
                  সতর্কতা ও গর্ভাবস্থা:
                </span>
                <p className="text-rose-800 font-medium leading-relaxed pl-4">
                  {medicine.precautions}
                </p>
              </div>
            )}
          </div>

          {/* Alternative Brands / Cheaper Generic Substitutes */}
          {alternatives.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={15} className="text-amber-500" />
                  <h4 className="text-xs font-black text-slate-800">
                    একই উপাদানের অন্যান্য ব্র্যান্ড ({alternatives.length}টি বিকল্প)
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  কম দামে বিকল্প
                </span>
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                একই উপাদানযুক্ত অন্য কোম্পানির ওষুধ দাম অনুযায়ী নিচে দেওয়া হলো — ডাক্তারের পরামর্শ অনুযায়ী নিতে পারেন:
              </p>

              <div className="space-y-2">
                {alternatives.slice(0, 5).map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => onSelectAlternative(alt)}
                    className="p-3 bg-white hover:bg-emerald-50/60 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-800 group-hover:text-emerald-700">
                          {alt.brandName}
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-400">
                          {alt.strength}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                        {alt.manufacturer}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-600">
                          ৳{toBengaliNumber(alt.unitPrice)}
                        </span>
                        <span className="text-[9px] text-slate-400 block">/পিস</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-600 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-3 bg-slate-100/70 rounded-xl text-[10px] text-slate-500 leading-relaxed font-medium">
            ⚕️ <span className="font-bold">সতর্কতা:</span> তথ্য শুধু জানার জন্য — ডাক্তারের পরামর্শ ছাড়া কোনো ওষুধ সেবন করবেন না বা ডোজ পরিবর্তন করবেন না। স্থানভেদে ওষুধের দাম কিছুটা কম-বেশি হতে পারে।
          </div>

        </div>

        {/* Bottom Action Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white flex items-center gap-2">
          <button
            onClick={() => onOpenCalculatorWithMed(medicine)}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer min-h-[44px]"
          >
            <Calculator size={16} />
            <span>ওষুধের হিসাব ক্যালকুলেটরে যোগ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
