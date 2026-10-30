import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, Sparkles, X, UserCheck, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { FacebookBadgeIcon } from "./FacebookBadgeIcon";

export { FacebookBadgeIcon };

export interface FacebookVerifiedBadgeProps {
  size?: number;
  className?: string;
  name?: string;
  badgeType?: "user" | "business" | "official" | "professional";
  interactive?: boolean;
  colorScheme?: "emerald" | "blue" | "gold";
}

export const FacebookVerifiedBadge: React.FC<FacebookVerifiedBadgeProps> = ({
  size = 15,
  className = "",
  name = "",
  badgeType = "user",
  interactive = true,
  colorScheme = "blue"
}) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const badgeTitle = badgeType === "business" 
    ? "ভেরিফাইড ব্যবসা প্রতিষ্ঠান" 
    : badgeType === "official" 
    ? "অফিসিয়াল পুঠিয়া নাগরিক / প্রতিষ্ঠান" 
    : badgeType === "professional"
    ? "ভেরিফাইড পেশাজীবী"
    : "যাচাইকৃত প্রোফাইল (Verified Profile)";

  const handleBadgeClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      <span
        onClick={handleBadgeClick}
        className={`inline-flex items-center cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-150 shrink-0 ${className}`}
        title={`${badgeTitle} - বিস্তারিত দেখতে ক্লিক করুন`}
      >
        <FacebookBadgeIcon size={size} colorScheme={colorScheme} />
      </span>

      {/* Facebook Meta Verified Style Popover Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans text-left" onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Modal Header - Official Meta Blue Gradient */}
              <div className="bg-gradient-to-r from-[#0052D4] via-[#4364F7] to-[#6FB1FC] p-5 text-white relative">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition border-0 cursor-pointer"
                >
                  <X size={16} />
                </button>

                <div className="flex flex-col items-center text-center space-y-2 pt-2">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/30 shadow-lg">
                    <FacebookBadgeIcon size={38} colorScheme="blue" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center justify-center gap-1.5">
                      <span>{name || "ব্লু ভেরিফাইড প্রোফাইল"}</span>
                      <FacebookBadgeIcon size={18} colorScheme="blue" />
                    </h3>
                    <p className="text-[11px] text-blue-100 font-bold mt-0.5">{badgeTitle}</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                <div className="bg-blue-50/90 rounded-2xl p-3.5 border border-blue-100 space-y-2 text-xs">
                  <p className="font-extrabold text-blue-950 flex items-center gap-1.5 text-sm">
                    <ShieldCheck size={18} className="text-[#1877F2] shrink-0" />
                    <span>ভেরিফাইড প্রোফাইলের তথ্য:</span>
                  </p>
                  <p className="text-blue-900 leading-relaxed text-[12px] font-medium">
                    আমাদের পুঠিয়া টিম এই অ্যাকাউন্টের পরিচয় (জাতীয় পরিচয়পত্র/NID) ও তথ্য ম্যানুয়ালি পরীক্ষা ও যাচাই করে এই **ব্লু ভেরিফাইড ব্যাজ** নিশ্চিত করেছে।
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    ব্লু ভেরিফাইড ব্যাজের সুবিধাসমূহ:
                  </h4>
                  <ul className="text-xs space-y-2 text-slate-700 font-medium pl-1">
                    <li className="flex items-start gap-2">
                      <span className="text-[#1877F2] font-black shrink-0">✓</span>
                      <span>নামের পাশে আসল ফেসবুক স্টাইল ব্লু ভেরিফাইড ব্যাজ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#1877F2] font-black shrink-0">✓</span>
                      <span>আড্ডা ফিড, সার্ভিস, রিলস ও কমেন্টে প্রাধিকার রিচ ও বিশ্বস্ততা</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#1877F2] font-black shrink-0">✓</span>
                      <span>ভুয়া অ্যাকাউন্ট প্রতিরোধ ও আসল নাগরিকের নিশ্চয়তা</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      navigate("/get-verified");
                    }}
                    className="w-full py-3 px-4 bg-[#1877F2] hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition border-0 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles size={15} className="text-amber-300 animate-pulse" />
                    <span>আপনিও ভেরিফাইড ব্যাজ নিন (৳১৫০)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition border-0 cursor-pointer"
                  >
                    ঠিক আছে (বন্ধ করুন)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FacebookVerifiedBadge;
