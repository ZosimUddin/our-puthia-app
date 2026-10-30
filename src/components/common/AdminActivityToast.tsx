import React from 'react';
import { Bell, ArrowRight, X, ShieldAlert, Store, Stethoscope, GraduationCap, CheckCircle } from 'lucide-react';

export interface AdminActivityItem {
  id?: string;
  title: string;
  category: string;
  submitterName?: string;
  submitterPhone?: string;
  collectionName?: string;
  link?: string;
  time?: string;
}

interface AdminActivityToastProps {
  item: AdminActivityItem;
  onDismiss: () => void;
  onAction: () => void;
}

export const AdminActivityToast: React.FC<AdminActivityToastProps> = ({
  item,
  onDismiss,
  onAction
}) => {
  const getCategoryIcon = (cat: string) => {
    if (cat.includes('ডাক্তার') || cat.includes('স্বাস্থ্য')) return <Stethoscope size={14} className="text-rose-600" />;
    if (cat.includes('শিক্ষা') || cat.includes('স্কুল') || cat.includes('কোচিং')) return <GraduationCap size={14} className="text-blue-600" />;
    return <Store size={14} className="text-emerald-700" />;
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-emerald-200/90 text-slate-900 transition-all duration-300 animate-in fade-in slide-in-from-top-4 pointer-events-auto">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
          <span className="text-[10px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Bell size={10} className="text-emerald-700 animate-bounce" />
            <span>Admin Activity</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400">রিয়েল-টাইম</span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer border-none bg-transparent"
          aria-label="Close"
        >
          <X size={15} />
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-xs font-black text-slate-900 line-clamp-1 leading-snug">
              {item.title}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                {getCategoryIcon(item.category)}
                <span>{item.category}</span>
              </span>
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                অপেক্ষমাণ
              </span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-600 font-medium">
          জমা দিয়েছেন: <span className="font-bold text-slate-800">{item.submitterName || 'নাগরিক'}</span>
          {item.submitterPhone ? ` (${item.submitterPhone})` : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-slate-400">
          {item.time || 'এইমাত্র জমা হয়েছে'}
        </span>

        <button
          type="button"
          onClick={() => {
            onAction();
            onDismiss();
          }}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer border-none active:scale-95"
        >
          <span>যাচাই / অনুমোদন করুন</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
