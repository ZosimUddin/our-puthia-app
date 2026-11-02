import React from "react";
import { 
  Wallet, 
  BadgeCheck, 
  Megaphone, 
  Radio, 
  Settings, 
  LogOut,
  ChevronRight,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";

interface UniversalUserActionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UniversalUserActionsDrawer: React.FC<UniversalUserActionsDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleAction = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    onClose();
    try {
      await logout();
      navigate("/adda");
      toast.success("সফলভাবে লগআউট হয়েছেন");
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0 backdrop-blur-xs">
          <div 
            className="absolute inset-0 bg-black/60" 
            onClick={onClose} 
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative bg-white rounded-t-[32px] w-full max-w-lg p-5 pb-8 shadow-2xl border-t border-slate-100 z-10 select-none"
          >
            {/* Drag handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4" />

            <div className="space-y-1 divide-y divide-slate-100">
              {/* 1. My Wallet */}
              <button
                type="button"
                onClick={() => handleAction("/wallet")}
                className="w-full flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-slate-50 text-left transition cursor-pointer border-0 bg-transparent"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0">
                  <Wallet size={20} className="stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black text-slate-900 leading-tight">আমার ওয়ালেট</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">ব্যালেন্স, রিচার্জ ও ক্যাশআউট</p>
                </div>
              </button>

              {/* 2. Get Verified */}
              <button
                type="button"
                onClick={() => handleAction("/get-verified")}
                className="w-full flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-slate-50 text-left transition cursor-pointer border-0 bg-transparent"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <BadgeCheck size={20} className="stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black text-slate-900 leading-tight">ভেরিফাইড ব্যাজ পান</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">ভেরিফিকেশনের আবেদন — ৳৫০০</p>
                </div>
              </button>

              {/* 3. Create Advertisement */}
              <button
                type="button"
                onClick={() => handleAction("/ads/create")}
                className="w-full flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-slate-50 text-left transition cursor-pointer border-0 bg-transparent"
              >
                <div className="w-10 h-10 rounded-full bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0">
                  <Megaphone size={20} className="stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black text-slate-900 leading-tight">বিজ্ঞাপন তৈরি করুন</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">আপনার ব্যবসা বা কন্টেন্ট প্রচার করুন</p>
                </div>
              </button>

              {/* 4. My Advertisements */}
              <button
                type="button"
                onClick={() => handleAction("/my-ads")}
                className="w-full flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-slate-50 text-left transition cursor-pointer border-0 bg-transparent"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#00C853] flex items-center justify-center shrink-0">
                  <Radio size={20} className="stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black text-slate-900 leading-tight">আমার বিজ্ঞাপনসমূহ</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">বিজ্ঞাপনসমূহ ম্যানেজ করুন</p>
                </div>
              </button>

              {/* 5. Settings */}
              <button
                type="button"
                onClick={() => handleAction("/settings")}
                className="w-full flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-slate-50 text-left transition cursor-pointer border-0 bg-transparent"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Settings size={20} className="stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black text-slate-900 leading-tight">সেটিংস</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">অ্যাপ প্রেফারেন্স, ক্যাশ ও প্রাইভেসি</p>
                </div>
                <ChevronRight size={18} className="text-slate-400 shrink-0" />
              </button>

              {/* 6. Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-slate-50 text-left transition cursor-pointer border-0 bg-transparent"
              >
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <LogOut size={20} className="stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black text-rose-600 leading-tight">লগআউট</p>
                </div>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition cursor-pointer border-0"
            >
              বন্ধ করুন
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
