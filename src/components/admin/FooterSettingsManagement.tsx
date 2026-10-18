import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, RefreshCw, CheckCircle2, AlertCircle, Eye, 
  ExternalLink, Users, Leaf, ArrowUpDown, ArrowUp, ArrowDown,
  ShieldCheck, ShieldAlert, Sparkles, Globe, Link2, Info, Loader2,
  Check, Copy, CheckCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { FooterSettings, DEFAULT_FOOTER_SETTINGS } from '../../types';
import { 
  getFooterSettings, 
  saveFooterSettings, 
  resetFooterSettings, 
  validateUrl 
} from '../../services/footerSettingsService';
import { FooterSection } from '../common/FooterSection';
import toast from 'react-hot-toast';

export const FooterSettingsManagement: React.FC = () => {
  const { user, userProfile } = useAuth();

  // Super Admin Check
  const isSuperAdmin = 
    userProfile?.role === 'super_admin' || 
    user?.email === 'mdzosimuddin31@gmail.com' ||
    user?.email === 'mdzosimuddin47@gmail.com' ||
    user?.email === 'josimuddinadds@gmail.com';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [settings, setSettings] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);

  // Form field error messages
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccessBanner, setSaveSuccessBanner] = useState<string | null>(null);

  // Load initial settings
  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getFooterSettings();
        if (mounted) {
          setSettings(data);
          setOriginalSettings(data);
        }
      } catch (err) {
        console.error("Failed to load footer settings:", err);
        toast.error("সেটিংস লোড করতে সমস্যা হয়েছে। ডিফল্ট ভ্যালু প্রদর্শন করা হচ্ছে।");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSettings();
    return () => { mounted = false; };
  }, []);

  // Handle URL Validation
  const validateForm = (section?: 'page' | 'group' | 'all'): boolean => {
    const newErrors: Record<string, string> = {};

    if (section === 'page' || section === 'all') {
      if (settings.facebookPageEnabled) {
        const val = validateUrl(settings.facebookPageUrl, 'ফেসবুক পেজ লিংক');
        if (!val.isValid) {
          newErrors.facebookPageUrl = val.error || 'সঠিক ফেসবুক পেজ লিংক প্রদান করুন';
        }
      }
    }

    if (section === 'group' || section === 'all') {
      if (settings.facebookGroupEnabled) {
        const val = validateUrl(settings.facebookGroupUrl, 'ফেসবুক গ্রুপ লিংক');
        if (!val.isValid) {
          newErrors.facebookGroupUrl = val.error || 'সঠিক ফেসবুক গ্রুপ লিংক প্রদান করুন';
        }
      }
    }

    if (section === 'all') {
      if (!settings.authorName.trim()) {
        newErrors.authorName = 'লেখকের নাম ফাঁকা রাখা যাবে না';
      }
      if (!settings.siteName.trim()) {
        newErrors.siteName = 'ওয়েবসাইটের নাম ফাঁকা রাখা যাবে না';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save full settings or specific section
  const handleSave = async (sectionName: string = 'all') => {
    if (!isSuperAdmin) {
      toast.error("আপনার এই সেটিংস পরিবর্তনের অনুমতি নেই। শুধুমাত্র সুপার অ্যাডমিন এটি পরিবর্তন করতে পারবেন।");
      return;
    }

    const isValid = validateForm(sectionName === 'page' ? 'page' : sectionName === 'group' ? 'group' : 'all');
    if (!isValid) {
      toast.error("দয়া করে ফর্মের লাল চিহ্নিত ত্রুটিগুলো সংশোধন করুন।");
      return;
    }

    try {
      setSaving(true);
      setSavingSection(sectionName);
      setSaveSuccessBanner(null);

      const res = await saveFooterSettings(settings, {
        uid: user?.uid,
        email: user?.email || '',
        displayName: userProfile?.displayName || user?.displayName || 'Super Admin',
        role: 'super_admin'
      });

      if (res.success && res.data) {
        setSettings(res.data);
        setOriginalSettings(res.data);
        setSaveSuccessBanner("সফলভাবে সংরক্ষণ করা হয়েছে");
        toast.success("সফলভাবে সংরক্ষণ করা হয়েছে");
        setTimeout(() => setSaveSuccessBanner(null), 5000);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err?.message || "সংরক্ষণ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setSaving(false);
      setSavingSection(null);
    }
  };

  // Reset to Defaults
  const handleReset = async () => {
    if (!isSuperAdmin) return;
    if (!window.confirm("আপনি কি নিশ্চিত যে ফুটার ও সোশ্যাল সেটিংস ডিফল্ট মানে ফিরিয়ে নিতে চান?")) {
      return;
    }

    try {
      setSaving(true);
      const resetData = await resetFooterSettings({
        uid: user?.uid,
        email: user?.email || '',
        displayName: userProfile?.displayName || 'Super Admin'
      });
      setSettings(resetData);
      setOriginalSettings(resetData);
      setErrors({});
      toast.success("ডিফল্ট সেটিংসে সফলভাবে রিসেট করা হয়েছে");
    } catch (err: any) {
      toast.error("রিসেট করতে ব্যর্থ হয়েছে: " + err?.message);
    } finally {
      setSaving(false);
    }
  };

  // Toggle order of Facebook Page and Facebook Group
  const handleSwapOrder = () => {
    const currentOrder = settings.socialOrder || ['facebook_page', 'facebook_group'];
    const newOrder: ('facebook_page' | 'facebook_group')[] = 
      currentOrder[0] === 'facebook_page'
        ? ['facebook_group', 'facebook_page']
        : ['facebook_page', 'facebook_group'];

    setSettings({
      ...settings,
      socialOrder: newOrder
    });
    toast.success(
      newOrder[0] === 'facebook_page' 
        ? "১ম: ফেসবুক পেজ, ২য়: ফেসবুক গ্রুপ" 
        : "১ম: ফেসবুক গ্রুপ, ২য়: ফেসবুক পেজ"
    );
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto my-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-black text-rose-900">অননুমোদিত প্রবেশাধিকার</h2>
        <p className="text-sm font-semibold text-rose-700">
          এই পৃষ্ঠাটি শুধুমাত্র <span className="font-black text-rose-950">👑 সুপার অ্যাডমিন</span>-এর জন্য সংরক্ষিত। আপনার বর্তমান রোল দিয়ে এই সেটিংস পরিবর্তন করা সম্ভব নয়।
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3">
        <Loader2 size={36} className="animate-spin text-[#0B7A3B]" />
        <p className="text-sm font-bold text-slate-600">ফুটার ও সোশ্যাল সেটিংস লোড হচ্ছে...</p>
      </div>
    );
  }

  const isOrderPageFirst = (settings.socialOrder || [])[0] === 'facebook_page';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 px-3 sm:px-6">
      {/* 1. TOP HEADER & ACTION BAR */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0B7A3B] border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Globe size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                ফুটার ও সোশ্যাল লিংকস ব্যবস্থাপনা
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-[#0B7A3B] text-[11px] font-black border border-emerald-300/60">
                👑 সুপার অ্যাডমিন
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              সাইডবার ও হোমপেজের "আমাদের সাথে যুক্ত থাকুন" এবং নিচের কপিরাইট/লেখক অংশ নিয়ন্ত্রণ করুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
            title="সব ডিফল্ট মান ফিরিয়ে আনুন"
          >
            <RefreshCw size={14} />
            <span>ডিফল্ট রিস্টোর</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('all')}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#0B7A3B] hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {saving && savingSection === 'all' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>সকল পরিবর্তন সেভ করুন</span>
          </button>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION BANNER */}
      <AnimatePresence>
        {saveSuccessBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-800"
          >
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <span className="text-sm font-black">{saveSuccessBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: EDIT CONTROLS (8 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* ========================================================================= */}
          {/* FEATURE 1: SOCIAL SECTION SETTINGS                                        */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B7A3B]"></span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  ১. সোশ্যাল সেকশন সেটিংস (Social Section)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">কানেক্ট উইথ আস</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <p className="text-xs font-black text-slate-800">সেকশন প্রদর্শন করুন (Enable Section)</p>
                <p className="text-[11px] text-slate-500 font-medium">নিষ্ক্রিয় করলে সম্পূর্ণ সোশ্যাল কার্ডটি লুকানো থাকবে</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer min-h-[44px]">
                <input 
                  type="checkbox" 
                  checked={settings.socialSectionEnabled}
                  onChange={(e) => setSettings({ ...settings, socialSectionEnabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B7A3B]"></div>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span>সেকশন শিরোনাম (Section Title)</span>
                <span className="text-[10px] text-slate-400 font-bold">ডিফল্ট: আমাদের সাথে যুক্ত থাকুন</span>
              </label>
              <input
                type="text"
                value={settings.socialSectionTitle}
                onChange={(e) => setSettings({ ...settings, socialSectionTitle: e.target.value })}
                placeholder="আমাদের সাথে যুক্ত থাকুন"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#0B7A3B] transition-all outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FEATURE 2: FACEBOOK PAGE SETTINGS                                         */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-blue-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  ২. ফেসবুক পেজ সেটিংস (Facebook Page)
                </h3>
              </div>

              <button
                type="button"
                onClick={() => handleSave('page')}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 min-h-[36px]"
              >
                {saving && savingSection === 'page' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>পেজ সেভ</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100">
              <div>
                <p className="text-xs font-black text-slate-800">ফেসবুক পেজ বাটন সক্রিয় করুন</p>
                <p className="text-[11px] text-slate-500 font-medium">নিষ্ক্রিয় করলে পেজের বাটনটি ফুটার থেকে হাইড থাকবে</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer min-h-[44px]">
                <input 
                  type="checkbox" 
                  checked={settings.facebookPageEnabled}
                  onChange={(e) => setSettings({ ...settings, facebookPageEnabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">ডিসপ্লে নাম (Display Name)</label>
                <input
                  type="text"
                  value={settings.facebookPageName}
                  onChange={(e) => setSettings({ ...settings, facebookPageName: e.target.value })}
                  placeholder="ফেসবুক পেজ"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 transition-all outline-none min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">সাবটাইটেল (Subtitle)</label>
                <input
                  type="text"
                  value={settings.facebookPageSubtitle}
                  onChange={(e) => setSettings({ ...settings, facebookPageSubtitle: e.target.value })}
                  placeholder="অফিসিয়াল আপডেট"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 transition-all outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span>ফেসবুক পেজ লিংক (Facebook Page URL) *</span>
                <span className="text-[10px] text-slate-400 font-bold">যেমন: https://facebook.com/ourputhia</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={settings.facebookPageUrl}
                  onChange={(e) => {
                    setSettings({ ...settings, facebookPageUrl: e.target.value });
                    if (errors.facebookPageUrl) {
                      setErrors(prev => ({ ...prev, facebookPageUrl: '' }));
                    }
                  }}
                  placeholder="https://facebook.com/..."
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 focus:bg-white transition-all outline-none min-h-[44px] ${
                    errors.facebookPageUrl ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.facebookPageUrl && (
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{errors.facebookPageUrl}</span>
                </p>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FEATURE 3: FACEBOOK GROUP SETTINGS                                        */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-indigo-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#4267B2] text-white flex items-center justify-center shrink-0">
                  <Users size={15} strokeWidth={2.4} />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  ৩. ফেসবুক গ্রুপ সেটিংস (Facebook Group)
                </h3>
              </div>

              <button
                type="button"
                onClick={() => handleSave('group')}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 min-h-[36px]"
              >
                {saving && savingSection === 'group' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>গ্রুপ সেভ</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <div>
                <p className="text-xs font-black text-slate-800">ফেসবুক গ্রুপ বাটন সক্রিয় করুন</p>
                <p className="text-[11px] text-slate-500 font-medium">নিষ্ক্রিয় করলে গ্রুপের বাটনটি ফুটার থেকে হাইড থাকবে</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer min-h-[44px]">
                <input 
                  type="checkbox" 
                  checked={settings.facebookGroupEnabled}
                  onChange={(e) => setSettings({ ...settings, facebookGroupEnabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">ডিসপ্লে নাম (Display Name)</label>
                <input
                  type="text"
                  value={settings.facebookGroupName}
                  onChange={(e) => setSettings({ ...settings, facebookGroupName: e.target.value })}
                  placeholder="ফেসবুক গ্রুপ"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all outline-none min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">সাবটাইটেল (Subtitle)</label>
                <input
                  type="text"
                  value={settings.facebookGroupSubtitle}
                  onChange={(e) => setSettings({ ...settings, facebookGroupSubtitle: e.target.value })}
                  placeholder="পাবলিক আলোচনা"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span>ফেসবুক গ্রুপ লিংক (Facebook Group URL) *</span>
                <span className="text-[10px] text-slate-400 font-bold">যেমন: https://facebook.com/groups/ourputhia</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={settings.facebookGroupUrl}
                  onChange={(e) => {
                    setSettings({ ...settings, facebookGroupUrl: e.target.value });
                    if (errors.facebookGroupUrl) {
                      setErrors(prev => ({ ...prev, facebookGroupUrl: '' }));
                    }
                  }}
                  placeholder="https://facebook.com/groups/..."
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 focus:bg-white transition-all outline-none min-h-[44px] ${
                    errors.facebookGroupUrl ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500'
                  }`}
                />
              </div>
              {errors.facebookGroupUrl && (
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{errors.facebookGroupUrl}</span>
                </p>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FEATURE 7: SOCIAL LINKS ORDERING                                          */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown size={16} className="text-[#0B7A3B]" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  ৪. সোশ্যাল লিংক সাজানোর ক্রম (Social Links Ordering)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">সিরিয়াল অর্ডার</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-800">
                  বর্তমান প্রদর্শন ক্রম:
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-black border border-blue-200">
                    ১. {isOrderPageFirst ? (settings.facebookPageName || "ফেসবুক পেজ") : (settings.facebookGroupName || "ফেসবুক গ্রুপ")}
                  </span>
                  <span className="text-slate-400 text-xs font-bold">➔</span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-[11px] font-black border border-indigo-200">
                    ২. {isOrderPageFirst ? (settings.facebookGroupName || "ফেসবুক গ্রুপ") : (settings.facebookPageName || "ফেসবুক পেজ")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSwapOrder}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[44px]"
              >
                <ArrowUpDown size={14} />
                <span>ক্রম উল্টান (Swap Order)</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FEATURE 4, 5, 6: FOOTER COPYRIGHT, AUTHOR, TAGLINE                       */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Leaf size={16} className="text-[#0B7A3B]" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  ৫. ফুটার কপিরাইট, লেখক ও ট্যাগলাইন (Footer & Copyright)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">ব্র্যান্ডিং ও ক্রেডিট</span>
            </div>

            {/* 4. Copyright Details */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>কপিরাইট তথ্য (Copyright Information)</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">কপিরাইট সাল (Year)</label>
                  <input
                    type="text"
                    value={settings.copyrightYear}
                    onChange={(e) => setSettings({ ...settings, copyrightYear: e.target.value })}
                    placeholder="২০২৬"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#0B7A3B] outline-none min-h-[44px]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600">সাইটের নাম (Site Name)</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    placeholder="আমাদের পুঠিয়া"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#0B7A3B] outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">কপিরাইট নোটিশ (Copyright Text)</label>
                <input
                  type="text"
                  value={settings.copyrightText}
                  onChange={(e) => setSettings({ ...settings, copyrightText: e.target.value })}
                  placeholder="সর্বস্বত্ব সংরক্ষিত"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#0B7A3B] outline-none min-h-[44px]"
                />
                <p className="text-[10px] text-slate-400 font-bold">
                  ফলাফল: © {settings.copyrightYear || "২০২৬"} {settings.siteName || "আমাদের পুঠিয়া"} {settings.copyrightText || "সর্বস্বত্ব সংরক্ষিত"}
                </p>
              </div>
            </div>

            {/* 5. Author / Name */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span>ফুটার লেখক / নাম (Footer Author/Name)</span>
                <span className="text-[10px] text-slate-400 font-bold">ডিফল্ট: JOSIM UDDIN</span>
              </label>
              <input
                type="text"
                value={settings.authorName}
                onChange={(e) => setSettings({ ...settings, authorName: e.target.value })}
                placeholder="JOSIM UDDIN"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-900 focus:bg-white focus:border-[#0B7A3B] outline-none min-h-[44px] tracking-wider"
              />
            </div>

            {/* 6. Footer Tagline */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span>ফুটার ট্যাগলাইন (Footer Tagline & Emoji)</span>
                <span className="text-[10px] text-slate-400 font-bold">ডিফল্ট: ভালোবাসি পুঠিয়া ❤️</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="text"
                  value={settings.taglineText || "ভালোবাসি পুঠিয়া"}
                  onChange={(e) => setSettings({ ...settings, taglineText: e.target.value })}
                  placeholder="ভালোবাসি পুঠিয়া"
                  className="col-span-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#0B7A3B] outline-none min-h-[44px]"
                />
                <input
                  type="text"
                  value={settings.taglineEmoji || "❤️"}
                  onChange={(e) => setSettings({ ...settings, taglineEmoji: e.target.value })}
                  placeholder="❤️"
                  className="col-span-1 text-center px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold focus:bg-white focus:border-[#0B7A3B] outline-none min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* BOTTOM MAIN SAVE BUTTON */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSave('all')}
              disabled={saving}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0B7A3B] hover:bg-emerald-700 text-white text-sm font-black transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 min-h-[48px]"
            >
              {saving && savingSection === 'all' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              <span>সব সেটিংস ডাটাবেসে সেভ করুন</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE REAL-TIME PREVIEW (5 Cols - Sticky on desktop) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          <div className="bg-slate-900 rounded-3xl p-5 text-white border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-emerald-400" />
                <h3 className="text-sm font-black tracking-wide text-white">
                  ৮. লাইভ প্রিভিউ (Live Preview)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                রিয়েল-টাইম
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              আপনি বামপাশে যা যা পরিবর্তন করবেন, নিচে ঠিক সাইডবার ও ফুটারে যেভাবে দেখা যাবে তা রিয়েল-টাইমে দেখতে পাচ্ছেন:
            </p>

            {/* PREVIEW CONTAINER (Matching exact sidebar width and background) */}
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200/90 text-slate-900 shadow-inner">
              <div className="max-w-[320px] mx-auto">
                <FooterSection settings={settings} isPreview={true} />
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <ShieldCheck size={14} />
                <span>নিরাপত্তা ও অ্যাক্সেস কন্ট্রোল</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                এই সেটিংস পরিবর্তন শুধুমাত্র ভেরিফাইড 👑 Super Admin এর জন্য সীমাবদ্ধ। সাধারণ কোনো ইউজার বা স্টাফ এই ডেটা পরিবর্তন করতে পারবে না।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterSettingsManagement;
