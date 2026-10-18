import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCcw, Image, List, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { SiteSettings } from '../../types';

export default function MobileAppManagement() {
  const [activeTab, setActiveTab] = useState<'version' | 'update' | 'banner' | 'changelog'>('banner');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // App Banner State
  const [appBannerTitle, setAppBannerTitle] = useState('অ্যাপ ডাউনলোড করুন');
  const [appBannerSubtitle, setAppBannerSubtitle] = useState('আপনার ফোনে ইনস্টল করুন — দ্রুত ও সুবিধাজনক');
  const [appBannerNotice, setAppBannerNotice] = useState('🚧 আমাদের অ্যাপ ডেভেলপমেন্টের কাজ চলছে। দ্রুত অ্যাক্সেসের জন্য ওয়েব অ্যাপ ইনস্টল করুন।');
  const [appBannerPlayStoreLink, setAppBannerPlayStoreLink] = useState('');
  const [appBannerAppStoreLink, setAppBannerAppStoreLink] = useState('');
  const [appBannerEnabled, setAppBannerEnabled] = useState(true);
  const [apkDownloadUrl, setApkDownloadUrl] = useState('');

  // Version & Update State
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [minAppVersion, setMinAppVersion] = useState('1.0.0');
  const [forceUpdateEnabled, setForceUpdateEnabled] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'site_settings', 'main'));
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteSettings;
          if (data.appBannerTitle) setAppBannerTitle(data.appBannerTitle);
          if (data.appBannerSubtitle) setAppBannerSubtitle(data.appBannerSubtitle);
          if (data.appBannerNotice) setAppBannerNotice(data.appBannerNotice);
          if (data.appBannerPlayStoreLink) setAppBannerPlayStoreLink(data.appBannerPlayStoreLink);
          if (data.appBannerAppStoreLink) setAppBannerAppStoreLink(data.appBannerAppStoreLink);
          if (data.appBannerEnabled !== undefined) setAppBannerEnabled(data.appBannerEnabled);
          if (data.apkDownloadUrl) setApkDownloadUrl(data.apkDownloadUrl);

          if (data.appVersion) setAppVersion(data.appVersion);
          if (data.minAppVersion) setMinAppVersion(data.minAppVersion);
          if (data.forceUpdateEnabled !== undefined) setForceUpdateEnabled(data.forceUpdateEnabled);
          if (data.maintenanceMessage) setUpdateMessage(data.maintenanceMessage);
        }
      } catch (err) {
        console.error('Error fetching mobile app settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    try {
      await setDoc(doc(db, 'site_settings', 'main'), {
        appBannerTitle,
        appBannerSubtitle,
        appBannerNotice,
        appBannerPlayStoreLink,
        appBannerAppStoreLink,
        appBannerEnabled,
        apkDownloadUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSuccessMessage('হোমপেজ অ্যাপ ব্যানার সফলভাবে আপডেট করা হয়েছে!');
      window.dispatchEvent(new CustomEvent('site-settings-updated'));
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving app banner:', err);
      alert('সংরক্ষণ করতে সমস্যা হয়েছে: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    try {
      await setDoc(doc(db, 'site_settings', 'main'), {
        appVersion,
        minAppVersion,
        forceUpdateEnabled,
        maintenanceMessage: updateMessage,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSuccessMessage('অ্যাপ ভার্সন ও আপডেট সেটিংস সফলভাবে আপডেট করা হয়েছে!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving version:', err);
      alert('সংরক্ষণ করতে সমস্যা হয়েছে: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'banner', label: 'অ্যাপ ব্যানার (হোমপেজ)', icon: Image },
    { id: 'version', label: 'অ্যাপ ভার্সন', icon: Smartphone },
    { id: 'update', label: 'ফোর্স আপডেট', icon: RotateCcw },
    { id: 'changelog', label: 'চেঞ্জলগ', icon: List },
  ] as const;

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">মোবাইল অ্যাপ সেটিংস লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800">মোবাইল অ্যাপ ম্যানেজমেন্ট</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">হোমপেজের অ্যাপ ডাউনলোড ব্যানার ও মোবাইল অ্যাপ কনফিগারেশন নিয়ন্ত্রণ করুন।</p>
        </div>
        {successMessage && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-black border border-emerald-200 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      <div className="w-full bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-none no-scrollbar touch-pan-x">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-[16px] text-xs font-black transition-all shrink-0 flex-shrink-0 min-w-max cursor-pointer whitespace-nowrap ${
                activeTab === tab.id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'banner' && (
              <form onSubmit={handleSaveBanner} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">হোমপেজ অ্যাপ ডাউনলোড ব্যানার কনফিগারেশন</h3>
                    <p className="text-xs text-slate-500 mt-0.5">ব্যবহারকারীরা হোমপেজে যে অ্যাপ ডাউনলোড কার্ডটি দেখতে পান তা এখান থেকে নিয়ন্ত্রণ করুন।</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <input
                      type="checkbox"
                      checked={appBannerEnabled}
                      onChange={(e) => setAppBannerEnabled(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                    />
                    <span className="text-xs font-black text-emerald-900">ব্যানার প্রদর্শন করুন</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">ব্যানার প্রধান শিরোনাম (Title)</label>
                    <input
                      type="text"
                      value={appBannerTitle}
                      onChange={(e) => setAppBannerTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      placeholder="যেমন: অ্যাপ ডাউনলোড করুন"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">উপ-শিরোনাম (Subtitle)</label>
                    <input
                      type="text"
                      value={appBannerSubtitle}
                      onChange={(e) => setAppBannerSubtitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      placeholder="যেমন: আপনার ফোনে ইনস্টল করুন — দ্রুত ও সুবিধাজনক"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">জরুরি নোটিশ / সতর্কতা বক্স (Notice Text)</label>
                  <textarea
                    rows={2}
                    value={appBannerNotice}
                    onChange={(e) => setAppBannerNotice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    placeholder="যেমন: 🚧 আমাদের অ্যাপ ডেভেলপমেন্টের কাজ চলছে..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Google Play Store লিংক</label>
                    <input
                      type="url"
                      value={appBannerPlayStoreLink}
                      onChange={(e) => setAppBannerPlayStoreLink(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                      placeholder="https://play.google.com/store/apps/details?id=..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">App Store লিংক (iOS)</label>
                    <input
                      type="url"
                      value={appBannerAppStoreLink}
                      onChange={(e) => setAppBannerAppStoreLink(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                      placeholder="https://apps.apple.com/app/..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">সরাসরি APK ডাউনলোড URL</label>
                    <input
                      type="url"
                      value={apkDownloadUrl}
                      onChange={(e) => setApkDownloadUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                      placeholder="https://github.com/.../releases/download/.../app.apk"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তনসমূহ সংরক্ষণ করুন'}</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'version' && (
              <form onSubmit={handleSaveVersion} className="space-y-6">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900">অ্যাপ ভার্সন কনফিগারেশন</h3>
                  <p className="text-xs text-slate-500 mt-0.5">বর্তমান অ্যাপের সংস্করণ ও ন্যূনতম সংস্করণ নির্ধারণ করুন।</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">সর্বশেষ ভার্সন (Version Name)</label>
                    <input
                      type="text"
                      value={appVersion}
                      onChange={(e) => setAppVersion(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                      placeholder="1.0.0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">ন্যূনতম ভার্সন (Min Version)</label>
                    <input
                      type="text"
                      value={minAppVersion}
                      onChange={(e) => setMinAppVersion(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                      placeholder="1.0.0"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'ভার্সন সংরক্ষণ করুন'}</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'update' && (
              <form onSubmit={handleSaveVersion} className="space-y-6">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900">ফোর্স আপডেট কন্ট্রোল</h3>
                  <p className="text-xs text-slate-500 mt-0.5">ব্যবহারকারীদের বাধ্যতামূলক আপডেট প্রম্পট দেখানোর অপশন।</p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={forceUpdateEnabled}
                    onChange={(e) => setForceUpdateEnabled(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black text-slate-900 block">ফোর্স আপডেট সক্রিয় করুন</span>
                    <span className="text-[11px] text-slate-500">এটি সক্রিয় থাকলে ন্যূনতম ভার্সনের নিচের অ্যাপ ব্যবহারকারীরা আপডেট করতে বাধ্য থাকবে।</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">আপডেট বার্তা (Update Message)</label>
                  <textarea
                    rows={3}
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                    placeholder="দয়া করে আপনার অ্যাপটি সর্বশেষ সংস্করণে আপডেট করুন..."
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'আপডেট সেটিংস সংরক্ষণ করুন'}</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'changelog' && (
              <div className="space-y-4">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900">অ্যাপ চেঞ্জলগ হিস্ট্রি</h3>
                  <p className="text-xs text-slate-500 mt-0.5">প্রতিটি সংস্করণের নতুন ফিচারের বিবরণ।</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs font-bold">
                  ভবিষ্যত সংস্করণের রিলিজ নোট ও চেঞ্জলগ এখানে যুক্ত করা হবে।
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
