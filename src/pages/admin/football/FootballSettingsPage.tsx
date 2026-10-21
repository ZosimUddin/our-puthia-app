import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, ShieldCheck } from 'lucide-react';
import { FootballSettings } from '../../../types/football';
import {
  getFootballSettings,
  updateFootballSettings,
  DEFAULT_FOOTBALL_SETTINGS
} from '../../../services/footballService';

export const FootballSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<FootballSettings>(DEFAULT_FOOTBALL_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getFootballSettings().then(setSettings);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateFootballSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Settings className="text-slate-700" size={20} />
            <span>ফুটবল সিস্টেম সেটিংস (Tournament System Configuration)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">পয়েন্ট রুলস, ডিফল্ট সময়সীমা, কনফ্লিক্ট গার্ড ও ক্লাব পারমিশন সেটিংস।</p>
        </div>

        {saved && (
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            <span>সেটিংস সংরক্ষিত!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
        {/* Point Rules */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-slate-900 border-b pb-2">১. ডিফল্ট পয়েন্ট পদ্ধতি (Scoring Rules)</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700">জয়ের পয়েন্ট (Win)</label>
              <input
                type="number"
                value={settings.pointsWin}
                onChange={e => setSettings({ ...settings, pointsWin: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700">ড্র-এর পয়েন্ট (Draw)</label>
              <input
                type="number"
                value={settings.pointsDraw}
                onChange={e => setSettings({ ...settings, pointsDraw: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700">পরাজয়ের পয়েন্ট (Loss)</label>
              <input
                type="number"
                value={settings.pointsLoss}
                onChange={e => setSettings({ ...settings, pointsLoss: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
          </div>
        </div>

        {/* Match Defaults */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-slate-900 border-b pb-2">২. সাধারণ ম্যাচ ডিফল্ট</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700">ডিফল্ট ম্যাচের স্থিতিকাল (মিনিট)</label>
              <input
                type="number"
                value={settings.defaultMatchDuration}
                onChange={e => setSettings({ ...settings, defaultMatchDuration: parseInt(e.target.value) || 90 })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700">জরুরি যোগাযোগ হটলাইন</label>
              <input
                type="text"
                value={settings.contactEmergencyPhone}
                onChange={e => setSettings({ ...settings, contactEmergencyPhone: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
          </div>
        </div>

        {/* Guards & Automations */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-slate-900 border-b pb-2">৩. নিরাপত্তা ও অটোমেশন রুলস</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableFixtureConflictGuard}
                onChange={e => setSettings({ ...settings, enableFixtureConflictGuard: e.target.checked })}
              />
              <span className="text-xs font-bold text-slate-700">ম্যাচ শিডিউলে একই দল বা ভেন্যুর সময় সংঘর্ষ স্বয়ংক্রিয়ভাবে ব্লক করুন</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowClubAdminScoreSubmission}
                onChange={e => setSettings({ ...settings, allowClubAdminScoreSubmission: e.target.checked })}
              />
              <span className="text-xs font-bold text-slate-700">অনুমোদিত ক্লাব অ্যাডমিনদের স্কোর ও ফলাফল ড্রাফট করার অনুমতি দিন</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableLiveScoreNotifications}
                onChange={e => setSettings({ ...settings, enableLiveScoreNotifications: e.target.checked })}
              />
              <span className="text-xs font-bold text-slate-700">লাইভ স্কোর শুরু ও গোল হলে পুশ নোটিফিকেশন অ্যালার্ট দিন</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save size={14} />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস আপডেট করুন'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
