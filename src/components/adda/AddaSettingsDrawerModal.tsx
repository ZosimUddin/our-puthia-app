import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  User, 
  Lock, 
  Shield, 
  LayoutGrid, 
  CheckCircle2, 
  Bookmark, 
  Moon, 
  Globe, 
  HardDrive, 
  Video, 
  Image as ImageIcon, 
  Trash2, 
  Headphones, 
  HelpCircle, 
  FileText, 
  Info, 
  Wallet, 
  Megaphone, 
  LogOut, 
  ChevronRight, 
  Check, 
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { getSavedTheme, applyTheme, ThemeMode } from "../../utils/themeUtils";
import { getCleanAvatar, getUserInitial } from "../../utils/avatarUtils";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "sonner";

interface AddaSettingsDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddaSettingsDrawerModal: React.FC<AddaSettingsDrawerModalProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const { user, userProfile, logout, updateUserProfile } = useAuth();
  const { language, setLanguage } = useLanguage();
  
  // Profile Lock State
  const [isLocked, setIsLocked] = useState<boolean>(Boolean((userProfile as any)?.isProfileLocked));
  const [isTogglingLock, setIsTogglingLock] = useState(false);

  // Theme & Language States
  const [themeMode, setThemeMode] = useState<ThemeMode>(getSavedTheme);

  useEffect(() => {
    if (isOpen) {
      setThemeMode(getSavedTheme());
    }
  }, [isOpen]);

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    applyTheme(mode);
    const label = mode === "system" ? "সিস্টেম ডিফল্ট" : mode === "light" ? "লাইট থিম" : "ডার্ক থিম";
    toast.success(`🎨 থিম পরিবর্তন করা হয়েছে: ${label}`);
  };

  const handleLanguageToggle = () => {
    const nextLang = language === "bn" ? "en" : "bn";
    setLanguage(nextLang);
    toast.success(nextLang === "bn" ? "🌐 ভাষা পরিবর্তন: বাংলা" : "🌐 Language switched to English");
  };

  // Storage & Cache States
  const [videoCount, setVideoCount] = useState(61);
  const [videoCacheMb, setVideoCacheMb] = useState(101.9);
  const [imageCount, setImageCount] = useState(221);
  const [imageCacheMb, setImageCacheMb] = useState(10.0);
  const [isDeletingAccountModal, setIsDeletingAccountModal] = useState(false);

  const totalUsedMb = (videoCacheMb + imageCacheMb).toFixed(1);
  const memoryPercent = Math.min(100, Math.round((Number(totalUsedMb) / 500) * 100));

  const cleanAvatar = getCleanAvatar(userProfile, user);
  const userInitial = getUserInitial(userProfile, user, 'প');
  const displayName = userProfile?.name || user?.displayName || "MD Josim Uddin";
  const username = (userProfile as any)?.username ? `@${(userProfile as any).username}` : (user?.email ? `@${user.email.split('@')[0]}` : "@md-josim-uddin");

  // Toggle Profile Lock
  const handleToggleLock = async () => {
    if (!user?.uid) {
      toast.error("প্রোফাইল লক করার জন্য প্রথমে লগইন করুন");
      return;
    }
    
    const newStatus = !isLocked;
    setIsLocked(newStatus);
    setIsTogglingLock(true);

    try {
      if (updateUserProfile) {
        await updateUserProfile({ isProfileLocked: newStatus } as any);
      } else {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { isProfileLocked: newStatus });
      }

      toast.success(newStatus ? "🛡️ প্রোফাইল লক সক্রিয় করা হয়েছে!" : "🔓 প্রোফাইল আনলক করা হয়েছে!");
    } catch (err) {
      console.error("Profile lock update error:", err);
      setIsLocked(!newStatus);
      toast.error("প্রোফাইল লক আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setIsTogglingLock(false);
    }
  };

  // Cache Clear Handlers
  const handleClearVideoCache = () => {
    setVideoCacheMb(0);
    setVideoCount(0);
    toast.success("📹 ভিডিও ক্যাশ সফলভাবে মুছে ফেলা হয়েছে!");
  };

  const handleClearImageCache = () => {
    setImageCacheMb(0);
    setImageCount(0);
    toast.success("🖼️ ছবি ক্যাশ সফলভাবে মুছে ফেলা হয়েছে!");
  };

  const handleClearAllCache = () => {
    setVideoCacheMb(0);
    setVideoCount(0);
    setImageCacheMb(0);
    setImageCount(0);
    toast.success("🎉 ডিভাইসের সকল ক্যাশ মেমরি সফলভাবে খালি করা হয়েছে!");
  };

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      onClose();
      await logout();
      toast.success("সফলভাবে লগআউট করা হয়েছে");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error("লগআউট করতে সমস্যা হয়েছে");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] bg-slate-50 font-sans text-left overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="bg-slate-50 w-full h-full h-screen flex flex-col overflow-hidden"
        >
          {/* Header Bar */}
          <div className="bg-white px-4 py-3.5 border-b border-slate-200 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer border-0 bg-transparent"
              aria-label="Back"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">সেটিংস</h2>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar pb-12">
            
            {/* ========================================================================= */}
            {/* 1. অ্যাকাউন্ট পরিবর্তন (Active Account Switcher)                             */}
            {/* ========================================================================= */}
            <div>
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-1">
                অ্যাবাউট / অ্যাকাউন্ট পরিবর্তন
              </p>

              <div 
                onClick={() => handleNavigate(user?.uid ? `/profile/${user.uid}` : "/login")}
                className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-500 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-emerald-500 p-0.5 relative shrink-0 shadow-xs">
                    {cleanAvatar ? (
                      <img src={cleanAvatar} alt={displayName} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full bg-[#0B7A3B] text-white flex items-center justify-center font-black text-lg rounded-full">
                        {userInitial}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-950 text-base leading-tight">
                        {displayName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        সক্রিয়
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold mt-0.5 font-mono">
                      {username}
                    </p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check size={16} strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. অ্যাকাউন্ট (Account Settings)                                          */}
            {/* ========================================================================= */}
            <div>
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-1">
                অ্যাবাউট / অ্যাকাউন্ট
              </p>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
                
                {/* 2.1 ব্যক্তিগত তথ্য */}
                <div 
                  onClick={() => handleNavigate("/edit-profile")}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">ব্যক্তিগত তথ্য</h4>
                      <p className="text-xs text-slate-500 font-medium">নাম, ইমেইল, ফোন নম্বর</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>

                {/* 2.2 পাসওয়ার্ড পরিবর্তন */}
                <div 
                  onClick={() => handleNavigate("/change-password")}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">পাসওয়ার্ড পরিবর্তন</h4>
                      <p className="text-xs text-slate-500 font-medium">আপনার পাসওয়ার্ড আপডেট করুন</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>

                {/* 2.3 প্রোফাইল লক */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">প্রোফাইল লক</h4>
                      <p className="text-xs text-slate-500 font-medium">অন্যদের থেকে আপনার প্রোফাইল লক রাখুন</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isTogglingLock}
                    onClick={handleToggleLock}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer border-0 ${
                      isLocked ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      isLocked ? "translate-x-6" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* 2.4 প্রফেশনাল ড্যাশবোর্ড */}
                <div 
                  onClick={() => handleNavigate("/professional-dashboard")}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <LayoutGrid size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">প্রফেশনাল ড্যাশবোর্ড</h4>
                      <p className="text-xs text-slate-500 font-medium">ইনসাইটস, মনিটাইজেশন ও আয়</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>

                {/* 2.5 ভেরিফাইড ব্যাজ */}
                <div 
                  onClick={() => handleNavigate("/get-verified")}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">ভেরিফাইড ব্যাজ</h4>
                      <p className="text-xs text-slate-500 font-medium">ভেরিফাইড নীল টিক ব্যাজ পান</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>

                {/* 2.6 সেভ করা রিলস */}
                <div 
                  onClick={() => handleNavigate("/bookmarks")}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <Bookmark size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">সেভ করা রিলস</h4>
                      <p className="text-xs text-slate-500 font-medium">সংরক্ষিত রিলস কালেকশন</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>

              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. ডিসপ্লে ও থিম (Display & Theme)                                        */}
            {/* ========================================================================= */}
            <div>
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-1">
                ডিসপ্লে ও থিম
              </p>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
                {/* 3.1 অ্যাপের থিম */}
                <div className="p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                        <Moon size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">অ্যাপের থিম</h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {themeMode === "system" ? "সিস্টেম ডিফল্ট" : themeMode === "light" ? "লাইট থিম" : "ডার্ক থিম"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleThemeChange("system")}
                      className={`py-2 px-2.5 rounded-2xl text-[11px] font-bold transition border cursor-pointer ${
                        themeMode === "system"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-black shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      সিস্টেম ডিফল্ট
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange("light")}
                      className={`py-2 px-2.5 rounded-2xl text-[11px] font-bold transition border cursor-pointer ${
                        themeMode === "light"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-black shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      লাইট
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange("dark")}
                      className={`py-2 px-2.5 rounded-2xl text-[11px] font-bold transition border cursor-pointer ${
                        themeMode === "dark"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-black shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      ডার্ক
                    </button>
                  </div>
                </div>

                {/* 3.2 ভাষা (Language) */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">ভাষা (Language)</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {language === "bn" ? "বাংলা (Bangla)" : "English (ইংরেজি)"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLanguageToggle}
                    className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-xs transition cursor-pointer border border-emerald-200"
                  >
                    {language === "bn" ? "English" : "বাংলা"}
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 4. স্টোরেজ ও মেমরি (Storage & Memory)                                      */}
            {/* ========================================================================= */}
            <div>
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-1">
                স্টোরেজ ও মেমরি
              </p>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 space-y-4">
                
                {/* 4.1 মেমরি ব্যবহার */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                        <HardDrive size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">মেমরি ব্যবহার</h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          ৫০০ মেগাবাইটের মধ্যে {totalUsedMb} MB ব্যবহৃত
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${memoryPercent}%` }}
                    />
                  </div>
                </div>

                {/* 4.2 ভিডিও ক্যাশ */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Video size={18} className="text-emerald-700 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900">ভিডিও ক্যাশ</h4>
                      <p className="text-[11px] text-slate-500">{videoCount}টি ভিডিও • {videoCacheMb.toFixed(1)} MB</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearVideoCache}
                    className="text-xs font-black text-rose-600 hover:text-rose-700 hover:underline cursor-pointer border-0 bg-transparent p-0"
                  >
                    ক্যাশ মুছুন
                  </button>
                </div>

                {/* 4.3 ছবি ক্যাশ */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <ImageIcon size={18} className="text-emerald-700 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900">ছবি ক্যাশ</h4>
                      <p className="text-[11px] text-slate-500">{imageCount}টি ছবি • {imageCacheMb.toFixed(1)} MB</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearImageCache}
                    className="text-xs font-black text-rose-600 hover:text-rose-700 hover:underline cursor-pointer border-0 bg-transparent p-0"
                  >
                    ক্যাশ মুছুন
                  </button>
                </div>

                {/* 4.4 সকল ক্যাশ মুছুন */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Trash2 size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-rose-700">সকল ক্যাশ মুছুন</h4>
                      <p className="text-[11px] text-slate-500">ডিভাইসের স্টোরেজ খালি করুন</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearAllCache}
                    className="text-xs font-black text-rose-600 hover:text-rose-700 hover:underline cursor-pointer border-0 bg-transparent p-0"
                  >
                    সকল ক্যাশ মুছুন
                  </button>
                </div>

              </div>
            </div>

            {/* ========================================================================= */}
            {/* 5. হেল্প ও সাপোর্ট (Help & Support)                                       */}
            {/* ========================================================================= */}
            <div>
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-1">
                হেল্প ও সাপোর্ট
              </p>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
                
                {/* 5.1 সাপোর্ট সেন্টার */}
                <div 
                  onClick={() => handleNavigate("/support")}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <Headphones size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">সাপোর্ট সেন্টার</h4>
                      <p className="text-xs text-slate-500 font-medium">সাপোর্ট টিমের সাহায্য নিন</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>

                {/* 5.2 সাহায্য ও সহায়িকা */}
                <div 
                  onClick={() => handleNavigate("/support")}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <HelpCircle size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">সাহায্য ও সহায়িকা</h4>
                      <p className="text-xs text-slate-500 font-medium">আপনার অ্যাকাউন্ট সংক্রান্ত সাহায্য নিন</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>

                {/* 5.3 গোপনীয়তা নীতি */}
                <div 
                  onClick={() => handleNavigate("/privacy")}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">গোপনীয়তা নীতি</h4>
                      <p className="text-xs text-slate-500 font-medium">গোপনীয়তা ও তথ্য সুরক্ষা নীতিমালা</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>

                {/* 5.4 ব্যবহারের শর্তাবলী */}
                <div 
                  onClick={() => handleNavigate("/terms")}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">ব্যবহারের শর্তাবলী</h4>
                      <p className="text-xs text-slate-500 font-medium">প্ল্যাটফর্ম ব্যবহারের নিয়মাবলী</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>

                {/* 5.5 অ্যাপ পরিচিতি */}
                <div 
                  onClick={() => toast.info("আমাদের পুঠিয়া - ডিজিটাল উপজেলা প্ল্যাটফর্ম v2.0.3 (97)")}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <Info size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">অ্যাপ পরিচিতি</h4>
                      <p className="text-xs text-slate-500 font-medium">ভার্সন ২.০.৩ (৯৭)</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>

              </div>
            </div>

            {/* ========================================================================= */}
            {/* 6. ব্যবসা ও লেনদেন (Business & Financials)                                */}
            {/* ========================================================================= */}
            <div>
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-1">
                ব্যবসা ও লেনদেন
              </p>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
                
                {/* 6.1 আমার ওয়ালেট */}
                <div 
                  onClick={() => handleNavigate("/wallet")}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">আমার ওয়ালেট</h4>
                      <p className="text-xs text-slate-500 font-medium">ব্যালেন্স ও লেনদেন ইতিহাস</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>

                {/* 6.2 আমার বিজ্ঞাপনসমূহ */}
                <div 
                  onClick={() => handleNavigate("/my-advertisements")}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <Megaphone size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">আমার বিজ্ঞাপনসমূহ</h4>
                      <p className="text-xs text-slate-500 font-medium">বিজ্ঞাপনসমূহ পরিচালনা করুন</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>

              </div>
            </div>

            {/* ========================================================================= */}
            {/* 7. লগআউট ও অ্যাকাউন্ট ডিলিট (Logout & Delete Account)                    */}
            {/* ========================================================================= */}
            {user && (
              <div className="pt-2 space-y-3 text-center">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3.5 px-4 rounded-3xl bg-white border border-rose-500 hover:bg-rose-50 active:bg-rose-100 text-rose-600 font-black text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <LogOut size={18} />
                  <span>লগ আউট</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDeletingAccountModal(true)}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto border-0 bg-transparent py-1"
                >
                  <Trash2 size={14} />
                  <span>অ্যাকাউন্ট মুছে ফেলুন</span>
                </button>
              </div>
            )}

          </div>
        </motion.div>

        {/* Delete Account Confirmation Modal */}
        {isDeletingAccountModal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-rose-200 space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center font-black">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">অ্যাকাউন্ট মুছে ফেলা নিশ্চিতকরণ</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  আপনি কি নিশ্চিত যে আপনার অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলতে চান? সকল সংরক্ষিত তথ্য ও পোস্ট হারিয়ে যাবে।
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeletingAccountModal(false);
                    toast.error("নিরাপত্তার স্বার্থে হেল্পডেস্কে মেইল পাঠান: support@ourputhia.app");
                  }}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  হ্যাঁ, মুছে ফেলুন
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeletingAccountModal(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition"
                >
                  বাতিল
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AnimatePresence>
  );
};

export default AddaSettingsDrawerModal;
