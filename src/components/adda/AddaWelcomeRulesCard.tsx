import React, { useState } from "react";
import { Shield, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const AddaWelcomeRulesCard: React.FC = () => {
  // Check if user has already acknowledged/dismissed the rules card
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      return localStorage.getItem("adda_welcome_rules_seen_once") === "true";
    }
    return false;
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("adda_welcome_rules_seen_once", "true");
      } catch {}
    }
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -8 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10, marginBottom: 0, overflow: "hidden" }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
          className="bg-[#f0fdf4] border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 mb-2.5 sm:mb-3 shadow-2xs transition-all relative overflow-hidden"
        >
          <div className="flex items-start gap-3">
            {/* Shield Icon Badge - Green Theme */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-[#0B7A3B] to-[#01412F] flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5">
              <Shield className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              {/* Header Title + Green Understood Button */}
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  আড্ডায় স্বাগতম! কয়েকটা নিয়ম
                </h3>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-3.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-[#0B7A3B] hover:to-[#01412F] text-white text-xs font-black rounded-lg sm:rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all shrink-0 border-0"
                >
                  বুঝেছি
                </button>
              </div>

              {/* Rules Bullet List */}
              <ul className="mt-2 space-y-1.5 text-xs sm:text-[13px] text-slate-700 leading-relaxed font-medium">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
                  <span>সবার সাথে ভদ্র থাকুন — গালাগালি, হুমকি বা হয়রানি নয়।</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
                  <span>অশালীন শব্দ থাকলে পোস্ট নিজে থেকেই আটকে যাবে; বারবার হলে ২৪ ঘণ্টা লেখা বন্ধ।</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
                  <span>গুজব বা মিথ্যা খবর দেবেন না; খারাপ কিছু দেখলে “রিপোর্ট” করুন।</span>
                </li>
              </ul>
            </div>

            {/* Quick Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-2.5 right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-emerald-100/60 transition-colors cursor-pointer border-0 bg-transparent"
              title="বন্ধ করুন"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
