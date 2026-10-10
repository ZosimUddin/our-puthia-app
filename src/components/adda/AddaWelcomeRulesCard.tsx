import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

export const AddaWelcomeRulesCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('adda_rules_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('adda_rules_dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <div className={`bg-gradient-to-br from-amber-50/90 via-white to-orange-50/80 rounded-none sm:rounded-2xl border-y sm:border border-amber-200/80 p-3.5 sm:p-4 shadow-xs mx-0 sm:mx-2 mb-2 sm:mb-3 relative ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0B7A3B] to-[#10B981] flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-600/30 mt-0.5">
            <ShieldCheck size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[15px] font-black text-slate-800 mb-1 flex items-center gap-1.5">
              <span>আড্ডায় স্বাগতম! কয়েকটি নিয়ম</span>
            </h3>
            <ul className="text-xs sm:text-[13px] text-slate-600 space-y-1.5 list-disc list-inside font-medium leading-relaxed">
              <li>সবার সাথে ভদ্র থাকুন — গালিগালাজ, হুমকি বা হয়রানি নয়।</li>
              <li>অশালীন শব্দ থাকলে পোস্ট নিজে থেকেই আটকে যাবে; বারবার হলে ২৪ ঘণ্টা লেখা বন্ধ।</li>
              <li>গুজব বা মিথ্যা খবর দেবেন না; খারাপ কিছু দেখলে “রিপোর্ট” করুন।</li>
            </ul>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition shrink-0 cursor-pointer"
        >
          বুঝেছি
        </button>
      </div>
    </div>
  );
};
