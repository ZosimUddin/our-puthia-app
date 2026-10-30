import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Smartphone, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  DollarSign, 
  Copy, 
  Lock, 
  RefreshCw 
} from "lucide-react";
import toast from "react-hot-toast";
import { 
  verifiedBadgePaymentService, 
  VerifiedBadgePaymentSettings as SettingsType, 
  DEFAULT_VERIFIED_PAYMENT_SETTINGS,
  normalizeBdPhone,
  isValidBdPhone
} from "../../services/verifiedBadgePaymentService";
import { useAuth } from "../../contexts/AuthContext";

export const VerifiedBadgePaymentSettings: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Form State
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_VERIFIED_PAYMENT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<SettingsType>(DEFAULT_VERIFIED_PAYMENT_SETTINGS);

  // Load existing settings from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const loaded = await verifiedBadgePaymentService.getSettings();
        if (isMounted) {
          setSettings(loaded);
          setInitialSettings(loaded);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        toast.error("সেটিংস লোড করতে সমস্যা হয়েছে");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchConfig();
    return () => { isMounted = false; };
  }, []);

  const validateForm = (): boolean => {
    if (settings.badgePrice <= 0) {
      toast.error("ভেরিফাইড ব্যাজ মূল্য অবশ্যই ০-এর বেশি হতে হবে।");
      return false;
    }

    let updatedBkash = { ...settings.bkash };
    let updatedNagad = { ...settings.nagad };

    if (settings.bkash.enabled) {
      const normBkash = normalizeBdPhone(settings.bkash.number);
      if (!normBkash) {
        toast.error("বিকাশ সক্রিয় থাকলে বিকাশ পার্সোনাল নম্বর প্রদান আবশ্যক।");
        return false;
      }
      if (!isValidBdPhone(normBkash)) {
        toast.error("বিকাশ নম্বরটি সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর (যেমন: 01XXXXXXXXX) হতে হবে।");
        return false;
      }
      updatedBkash.number = normBkash;
    }

    if (settings.nagad.enabled) {
      const normNagad = normalizeBdPhone(settings.nagad.number);
      if (!normNagad) {
        toast.error("নগদ সক্রিয় থাকলে নগদ পার্সোনাল নম্বর প্রদান আবশ্যক।");
        return false;
      }
      if (!isValidBdPhone(normNagad)) {
        toast.error("নগদ নম্বরটি সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর (যেমন: 01XXXXXXXXX) হতে হবে।");
        return false;
      }
      updatedNagad.number = normNagad;
    }

    if (!settings.bkash.enabled && !settings.nagad.enabled) {
      toast.error("কমপক্ষে একটি পেমেন্ট মেথড (বিকাশ অথবা নগদ) সক্রিয় থাকতে হবে।");
      return false;
    }

    // Update settings state with normalized numbers
    setSettings({
      ...settings,
      bkash: updatedBkash,
      nagad: updatedNagad
    });

    return true;
  };

  const handlePreSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);
    try {
      const adminName = userProfile?.name || user?.displayName || user?.email || "সুপার এডমিন";
      await verifiedBadgePaymentService.saveSettings(settings, adminName);
      setInitialSettings(settings);
      toast.success("🎉 ভেরিফাইড ব্যাজ পেমেন্ট সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: any) {
      toast.error(err?.message ? `সেভ ব্যর্থ: ${err.message}` : "সেটিংস সংরক্ষণ করা সম্ভব হয়নি।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(initialSettings);
    toast("পরিবর্তনগুলো বাতিল করা হয়েছে", { icon: "↩️" });
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <RefreshCw size={28} className="animate-spin text-emerald-600 mx-auto" />
        <p className="text-xs font-bold text-slate-500">পেমেন্ট কনফিগারেশন লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black mb-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>সুপার অ্যাডমিন ম্যানুয়াল পেমেন্ট গেটওয়ে কনফিগারেশন</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              ব্লু ভেরিফাইড ব্যাজ পেমেন্ট সেটিংস
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-bold mt-1 max-w-2xl leading-relaxed">
              নাগরিকরা ব্লু ভেরিফাইড ব্যাজ কেনার জন্য যে ব্যক্তিগত বিকাশ ও নগদ অ্যাকাউন্টে টাকা পাঠাবেন তা এখান থেকে নিরাপদে কনফিগার করুন।
            </p>
          </div>

          <div className="shrink-0 bg-white/10 p-3.5 rounded-2xl border border-white/10 backdrop-blur-xs text-right">
            <span className="block text-[10px] font-bold text-emerald-300 uppercase tracking-wider">বর্তমান ব্যাজ ফি</span>
            <span className="text-2xl font-black text-white">৳{settings.badgePrice}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handlePreSave} className="space-y-6">

        {/* Global Price Setting */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <DollarSign size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">ভেরিফাইড ব্যাজ সাধারণ মূল্য কনফিগারেশন</h3>
              <p className="text-xs text-slate-500 font-medium">সমগ্র প্ল্যাটফর্মে ব্যাজ আবেদনের জন্য এই মূল্যটি প্রযোজ্য হবে।</p>
            </div>
          </div>

          <div className="max-w-xs space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              ভেরিফিকেশন ফি / মূল্য (টাকায়):
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">৳</span>
              <input
                type="number"
                min={10}
                max={10000}
                required
                value={settings.badgePrice}
                onChange={(e) => setSettings({ ...settings, badgePrice: Number(e.target.value) || 0 })}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* bKash Payment Box */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-pink-200/80 shadow-xs space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-pink-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E2136E]/10 border border-[#E2136E]/20 text-[#E2136E] flex items-center justify-center font-black shrink-0">
                <Smartphone size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    বিকাশ (bKash) পার্সোনাল অ্যাকাউন্ট সেটিংস
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-pink-100 text-[#E2136E] text-[10px] font-black uppercase">
                    Personal
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  নাগরিকরা এই নম্বরে Send Money করবেন।
                </p>
              </div>
            </div>

            {/* Toggle Enable/Disable */}
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs font-black text-slate-700">
                {settings.bkash.enabled ? "পেমেন্ট সক্রিয়" : "পেমেন্ট বন্ধ"}
              </span>
              <input
                type="checkbox"
                checked={settings.bkash.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  bkash: { ...settings.bkash, enabled: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E2136E]"></div>
            </label>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${settings.bkash.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                বিকাশ পার্সোনাল নম্বর (Send Money Number) *
              </label>
              <input
                type="tel"
                placeholder="যেমন: 01717XXXXXX"
                value={settings.bkash.number}
                onChange={(e) => setSettings({
                  ...settings,
                  bkash: { ...settings.bkash, number: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="text-[10px] text-slate-400 block">সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন</span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                অ্যাকাউন্ট হোল্ডারের ডিসপ্লে নাম (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="যেমন: আমাদের পুঠিয়া কর্তৃপক্ষ"
                value={settings.bkash.accountHolderName || ""}
                onChange={(e) => setSettings({
                  ...settings,
                  bkash: { ...settings.bkash, accountHolderName: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="text-[10px] text-slate-400 block">ব্যবহারকারী পেমেন্ট পেজে এটি দেখতে পাবেন</span>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                বাংলা নির্দেশিকা (ব্যবহারকারীকে প্রদর্শনের জন্য)
              </label>
              <textarea
                rows={2}
                value={settings.bkash.instructions}
                onChange={(e) => setSettings({
                  ...settings,
                  bkash: { ...settings.bkash, instructions: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Nagad Payment Box */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F7941D]/10 border border-[#F7941D]/20 text-[#F7941D] flex items-center justify-center font-black shrink-0">
                <Smartphone size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    নগদ (Nagad) পার্সোনাল অ্যাকাউন্ট সেটিংস
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-[#F7941D] text-[10px] font-black uppercase">
                    Personal
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  নাগরিকরা এই নম্বরে Send Money করবেন।
                </p>
              </div>
            </div>

            {/* Toggle Enable/Disable */}
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs font-black text-slate-700">
                {settings.nagad.enabled ? "পেমেন্ট সক্রিয়" : "পেমেন্ট বন্ধ"}
              </span>
              <input
                type="checkbox"
                checked={settings.nagad.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  nagad: { ...settings.nagad, enabled: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F7941D]"></div>
            </label>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${settings.nagad.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                নগদ পার্সোনাল নম্বর (Send Money Number) *
              </label>
              <input
                type="tel"
                placeholder="যেমন: 01717XXXXXX"
                value={settings.nagad.number}
                onChange={(e) => setSettings({
                  ...settings,
                  nagad: { ...settings.nagad, number: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-slate-400 block">সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন</span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                অ্যাকাউন্ট হোল্ডারের ডিসপ্লে নাম (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="যেমন: আমাদের পুঠিয়া কর্তৃপক্ষ"
                value={settings.nagad.accountHolderName || ""}
                onChange={(e) => setSettings({
                  ...settings,
                  nagad: { ...settings.nagad, accountHolderName: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-slate-400 block">ব্যবহারকারী পেমেন্ট পেজে এটি দেখতে পাবেন</span>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                বাংলা নির্দেশিকা (ব্যবহারকারীকে প্রদর্শনের জন্য)
              </label>
              <textarea
                rows={2}
                value={settings.nagad.instructions}
                onChange={(e) => setSettings({
                  ...settings,
                  nagad: { ...settings.nagad, instructions: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={14} />
            <span>পরিবর্তন বাতিল</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>সেটিংস সংরক্ষণ করুন</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal Before Saving */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-emerald-500/30 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  সেটিংস সংরক্ষণ নিশ্চিতকরণ
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  পেমেন্ট নম্বর সঠিকভাবে যাচাই করেছেন তো?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
              <p><strong className="text-slate-700">ব্যাজ মূল্য:</strong> ৳{settings.badgePrice}</p>
              <p><strong className="text-slate-700">বিকাশ নম্বর:</strong> {settings.bkash.enabled ? (settings.bkash.number || "দেওয়া হয়নি") : "বন্ধ"}</p>
              <p><strong className="text-slate-700">নগদ নম্বর:</strong> {settings.nagad.enabled ? (settings.nagad.number || "দেওয়া হয়নি") : "বন্ধ"}</p>
            </div>

            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              সেভ করার পর সাধারণ নাগরিকরা ভেরিফাইড ব্যাজ ক্রয়ের পেজে এই নম্বরগুলোই দেখতে পাবেন এবং টাকা পাঠাবেন।
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                হ্যাঁ, নিশ্চিতভাবে সেভ করুন
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
