import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  FileText, 
  MessageSquare, 
  Users, 
  UserPlus, 
  Film, 
  MessageCircle, 
  PhoneCall, 
  Bell, 
  Lock, 
  UploadCloud, 
  Video, 
  Flag, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Sliders,
  Sparkles,
  Shield,
  Zap,
  HardDrive
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { logAuditActivity } from '../../services/auditLogger';
import toast from 'react-hot-toast';

export interface AddaSystemSettingsConfig {
  // 1. Post Settings
  maxPostCharLength: number;
  maxPhotosPerPost: number;
  postEditWindowMinutes: number;
  allowLinkPreviews: boolean;
  allowPollsInPost: boolean;

  // 2. Comment Settings
  maxCommentLength: number;
  commentNestedDepth: number;
  allowImageComments: boolean;
  autoHideToxicComments: boolean;

  // 3. Friend Settings
  maxFriendRequestsPerDay: number;
  friendListDefaultPrivacy: 'public' | 'friends' | 'private';
  showMutualFriendsCount: boolean;

  // 4. Follow Settings
  allowPublicFollow: boolean;
  showFollowersCount: boolean;
  requireFollowApproval: boolean;

  // 5. Story Settings
  storyExpiryHours: number;
  maxStoryDurationSeconds: number;
  allowStoryReplies: boolean;

  // 6. Messenger Settings
  allowDirectMessagesFromNonFriends: boolean;
  messageDeleteWindowMinutes: number;
  maxChatAttachmentSizeMB: number;

  // 7. Call Settings
  enableAudioCalling: boolean;
  enableVideoCalling: boolean;
  maxCallDurationMinutes: number;
  callQualityPreset: 'low' | 'medium' | 'hd';

  // 8. Notification Settings
  enablePushNotifications: boolean;
  enableEmailDigests: boolean;
  enableSmsUrgentAlerts: boolean;

  // 9. Privacy Defaults
  defaultPostPrivacy: 'public' | 'friends' | 'private';
  allowSearchEngineIndexing: boolean;
  defaultProfileVisibility: 'public' | 'verified_only' | 'private';

  // 10. Upload Limits
  maxImageSizeMB: number;
  imageCompressionQualityPercent: number;
  maxUploadsPerUserPerDay: number;

  // 11. Video Limits
  maxVideoDurationSeconds: number;
  maxVideoSizeMB: number;
  maxReelDurationSeconds: number;
  enableHdVideoStreaming: boolean;

  // 12. Report Settings
  autoHideReportThresholdCount: number;
  reportReasonsList: string[];
  autoNotifyAdminsOnCriticalReport: boolean;

  // 13. Moderation Settings
  aiSpamFilterSensitivity: 'low' | 'medium' | 'strict';
  blockedKeywordsText: string;
  autoSuspendRepeatOffendersDays: number;
}

export const AddaSystemSettings: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('posts');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Config State
  const [config, setConfig] = useState<AddaSystemSettingsConfig>({
    // 1. Post Settings
    maxPostCharLength: 3000,
    maxPhotosPerPost: 10,
    postEditWindowMinutes: 30,
    allowLinkPreviews: true,
    allowPollsInPost: true,

    // 2. Comment Settings
    maxCommentLength: 1000,
    commentNestedDepth: 3,
    allowImageComments: true,
    autoHideToxicComments: true,

    // 3. Friend Settings
    maxFriendRequestsPerDay: 50,
    friendListDefaultPrivacy: 'friends',
    showMutualFriendsCount: true,

    // 4. Follow Settings
    allowPublicFollow: true,
    showFollowersCount: true,
    requireFollowApproval: false,

    // 5. Story Settings
    storyExpiryHours: 24,
    maxStoryDurationSeconds: 30,
    allowStoryReplies: true,

    // 6. Messenger Settings
    allowDirectMessagesFromNonFriends: false,
    messageDeleteWindowMinutes: 15,
    maxChatAttachmentSizeMB: 25,

    // 7. Call Settings
    enableAudioCalling: true,
    enableVideoCalling: true,
    maxCallDurationMinutes: 60,
    callQualityPreset: 'medium',

    // 8. Notification Settings
    enablePushNotifications: true,
    enableEmailDigests: true,
    enableSmsUrgentAlerts: false,

    // 9. Privacy Defaults
    defaultPostPrivacy: 'public',
    allowSearchEngineIndexing: true,
    defaultProfileVisibility: 'public',

    // 10. Upload Limits
    maxImageSizeMB: 10,
    imageCompressionQualityPercent: 85,
    maxUploadsPerUserPerDay: 100,

    // 11. Video Limits
    maxVideoDurationSeconds: 300,
    maxVideoSizeMB: 100,
    maxReelDurationSeconds: 60,
    enableHdVideoStreaming: true,

    // 12. Report Settings
    autoHideReportThresholdCount: 5,
    reportReasonsList: ['স্প্যাম / ফেক অ্যাকাউন্ট', 'মিথ্যা তথ্য / গুজব', 'গালিগালাজ / সহিংসতা', 'কপিরাইট লঙ্ঘন'],
    autoNotifyAdminsOnCriticalReport: true,

    // 13. Moderation Settings
    aiSpamFilterSensitivity: 'medium',
    blockedKeywordsText: 'জুয়া, ক্যাশব্যাক হ্যাক, ওটিপি শেয়ার, ভুয়া ফান্ড',
    autoSuspendRepeatOffendersDays: 7
  });

  // 1. Fetch & Listen to Settings from Firestore
  useEffect(() => {
    setLoading(true);
    const settingsRef = doc(db, 'system_settings', 'adda_global_config');

    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setConfig(prev => ({
          ...prev,
          ...d
        }));
      } else {
        // Initialize default doc
        setDoc(settingsRef, {
          ...config,
          updatedBy: userProfile?.name || 'Super Admin',
          updatedAt: serverTimestamp()
        }).catch(() => null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Firestore adda_global_config error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save Settings to Firestore
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const settingsRef = doc(db, 'system_settings', 'adda_global_config');
      await setDoc(settingsRef, {
        ...config,
        updatedBy: userProfile?.name || user?.displayName || 'সুপার এডমিন',
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Audit Logging
      await logAuditActivity({
        action: 'UPDATE_ADDA_SYSTEM_SETTINGS',
        details: 'সুপার এডমিন ড্যাশবোর্ড থেকে আড্ডা সোশ্যাল গ্লোবাল সিস্টেম সেটিংস আপডেট করা হয়েছে।',
        category: 'system',
        severity: 'info',
        targetType: 'site_settings'
      });

      toast.success('🎉 আড্ডা গ্লোবাল সিস্টেম সেটিং সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err) {
      console.error(err);
      toast.error('সেটিংস সংরক্ষণে ত্রুটি দেখা দিয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const SETTINGS_SECTIONS = [
    { id: 'posts', label: '১. Post Settings', icon: FileText, desc: 'পোস্টের দৈর্ঘ্য, ছবি ও অপশনসমূহ' },
    { id: 'comments', label: '২. Comment Settings', icon: MessageSquare, desc: 'কমেন্টের দৈর্ঘ্য, ডেপথ ও স্প্যাম ফিল্টার' },
    { id: 'friends', label: '৩. Friend Settings', icon: Users, desc: 'ফ্রেন্ড রিকোয়েস্ট ও বন্ধু তালিকা প্রাইভেসি' },
    { id: 'follow', label: '৪. Follow Settings', icon: UserPlus, desc: 'ফলো বাটন ও ফলোয়ার সংখ্যা প্রাইভেসী' },
    { id: 'story', label: '৫. Story Settings', icon: Film, desc: 'স্টোরির মেয়াদ, সময়সীমা ও রিপ্লাই' },
    { id: 'messenger', label: '৬. Messenger Settings', icon: MessageCircle, desc: 'ডাইরেক্ট মেসেজ, ফিল্টার ও এডিটিং মোট' },
    { id: 'calls', label: '৭. Call Settings', icon: PhoneCall, desc: 'অডিও/ভিডিও কল তদারকি ও ব্যান্ডউইথ' },
    { id: 'notifications', label: '৮. Notification Settings', icon: Bell, desc: 'পুশ নোটিফিকেশন, ইমেইল ও এসএমএস নোটিশ' },
    { id: 'privacy', label: '৯. Privacy Defaults', icon: Lock, desc: 'ডিফল্ট পোস্ট ও প্রোফাইল দৃশ্যমানতা' },
    { id: 'uploads', label: '১০. Upload Limits', icon: UploadCloud, desc: 'ফটো আপলোড সাইজ ও দৈনিক লিমিট' },
    { id: 'videos', label: '১১. Video Limits', icon: Video, desc: 'ভিডিও সাইজ, রিলস সময়সীমা ও এইচডি স্ট্রিমিং' },
    { id: 'reports', label: '১২. Report Settings', icon: Flag, desc: 'অটো-হাইড থ্রেশহোল্ড ও রিপোর্টের কারণ' },
    { id: 'moderation', label: '১৩. Moderation Settings', icon: ShieldCheck, desc: 'এআই স্প্যাম ডিটেকশন ও নিষিদ্ধ কি-ওয়ার্ড' },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-slate-100 shadow-2xs">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0B7A3B] mb-2" />
        <p className="text-xs font-bold">আড্ডা গ্লোবাল সেটিং ডাটাবেজ লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-white/20 text-white border border-white/20 rounded-full text-xs font-black uppercase inline-flex items-center gap-1.5 shadow-2xs">
            <Sliders size={14} className="text-emerald-300" /> Super Admin Global Control Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            আড্ডা সিস্টেম সেটিংস (Adda System Settings)
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-2xl leading-relaxed">
            এক নজরে আড্ডা সোশ্যাল প্ল্যাটফর্মের ১৩টি মডিউল সেটিং, ফাইল লিমিট, প্রাইভেসি ও এআই মডারেশন কনফিগারেশন
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-3.5 bg-white text-[#0B7A3B] hover:bg-emerald-50 rounded-2xl font-black text-xs transition shadow-lg flex items-center gap-2 cursor-pointer shrink-0 active:scale-95 disabled:opacity-50"
        >
          <Save size={16} className={saving ? 'animate-spin' : ''} />
          <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সকল সেটিংস সেভ করুন'}</span>
        </button>
      </div>

      {/* Main Settings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Navigation Sidebar (13 Sections) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-3 shadow-2xs space-y-1 h-fit">
          <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">১৩টি মডিউল সেটিংস</p>
          {SETTINGS_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === sec.id
                  ? 'bg-[#0B7A3B] text-white shadow-md font-black'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <sec.icon size={18} className={activeTab === sec.id ? 'text-white' : 'text-slate-500'} />
              <div className="min-w-0">
                <p className="truncate">{sec.label}</p>
                <p className={`text-[10px] truncate font-medium ${activeTab === sec.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {sec.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Right Form Settings Form Container */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
          
          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* 1. Post Settings */}
            {activeTab === 'posts' && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <FileText className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">১. Post Settings (পোস্ট সেটিংস)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">সর্বোচ্চ পোস্ট অক্ষর সংখ্যা (Max Characters):</label>
                    <input
                      type="number"
                      value={config.maxPostCharLength}
                      onChange={(e) => setConfig({ ...config, maxPostCharLength: parseInt(e.target.value) || 1000 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">প্রতি পোস্টে সর্বোচ্চ ছবি আপলোড সংখ্যা:</label>
                    <input
                      type="number"
                      value={config.maxPhotosPerPost}
                      onChange={(e) => setConfig({ ...config, maxPhotosPerPost: parseInt(e.target.value) || 5 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">পোস্ট সম্পাদন সময়সীমা (Edit Window Mins):</label>
                    <input
                      type="number"
                      value={config.postEditWindowMinutes}
                      onChange={(e) => setConfig({ ...config, postEditWindowMinutes: parseInt(e.target.value) || 15 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.allowLinkPreviews}
                      onChange={(e) => setConfig({ ...config, allowLinkPreviews: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">ওয়েব লিংক প্রিভিউ ও প্রাকদর্শন সক্রিয় রাখুন</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.allowPollsInPost}
                      onChange={(e) => setConfig({ ...config, allowPollsInPost: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">পোস্টে পোল (Polls / ভোটগ্রহণ) অপশন চালু রাখুন</span>
                  </label>
                </div>
              </div>
            )}

            {/* 2. Comment Settings */}
            {activeTab === 'comments' && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <MessageSquare className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">২. Comment Settings (কমেন্ট সেটিংস)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">সর্বোচ্চ কমেন্ট অক্ষর সংখ্যা:</label>
                    <input
                      type="number"
                      value={config.maxCommentLength}
                      onChange={(e) => setConfig({ ...config, maxCommentLength: parseInt(e.target.value) || 500 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">কমেন্ট নেস্টেড রিপ্লাই লেভেল (Nested Depth):</label>
                    <input
                      type="number"
                      value={config.commentNestedDepth}
                      onChange={(e) => setConfig({ ...config, commentNestedDepth: parseInt(e.target.value) || 2 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.allowImageComments}
                      onChange={(e) => setConfig({ ...config, allowImageComments: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">কমেন্টে ছবি ও জিআইএফ (GIF) আপলোড চালু রাখুন</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoHideToxicComments}
                      onChange={(e) => setConfig({ ...config, autoHideToxicComments: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">আপত্তিকর ও গালিগালাজপূর্ণ মন্তব্য স্বয়ংক্রিয় হাইড করুন</span>
                  </label>
                </div>
              </div>
            )}

            {/* 3. Friend Settings */}
            {activeTab === 'friends' && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Users className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">৩. Friend Settings (ফ্রেন্ড সেটিংস)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">দৈনিক সর্বোচ্চ ফ্রেন্ড রিকোয়েস্ট পাঠাবারের সীমা:</label>
                    <input
                      type="number"
                      value={config.maxFriendRequestsPerDay}
                      onChange={(e) => setConfig({ ...config, maxFriendRequestsPerDay: parseInt(e.target.value) || 30 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">ফ্রেন্ড লিস্টের ডিফল্ট প্রাইভেসি:</label>
                    <select
                      value={config.friendListDefaultPrivacy}
                      onChange={(e) => setConfig({ ...config, friendListDefaultPrivacy: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    >
                      <option value="public">পাবলিক (সবাই দেখতে পাবে)</option>
                      <option value="friends">শুধু বন্ধুরা দেখতে পাবে</option>
                      <option value="private">গোপন (শুধুমাত্র নিজে)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showMutualFriendsCount}
                      onChange={(e) => setConfig({ ...config, showMutualFriendsCount: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">মিউচুয়াল ফ্রেন্ডস (Mutual Friends) প্রদর্শন করুন</span>
                  </label>
                </div>
              </div>
            )}

            {/* 4. Follow Settings */}
            {activeTab === 'follow' && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <UserPlus className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">৪. Follow Settings (ফলো সেটিংস)</h3>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.allowPublicFollow}
                      onChange={(e) => setConfig({ ...config, allowPublicFollow: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">নাগরিক প্রোফাইলে পাবলিক ফলো অপশন সচল রাখুন</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showFollowersCount}
                      onChange={(e) => setConfig({ ...config, showFollowersCount: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">প্রোফাইলে অনুসারী বা ফলোয়ার সংখ্যা প্রদর্শন করুন</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.requireFollowApproval}
                      onChange={(e) => setConfig({ ...config, requireFollowApproval: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">প্রাইভেট একাউন্টে ফলো রিকোয়েস্ট অনুমোদন বাধ্যতামূলক রাখুন</span>
                  </label>
                </div>
              </div>
            )}

            {/* 5. Story Settings */}
            {activeTab === 'story' && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Film className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">৫. Story Settings (স্টোরি সেটিংস)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">স্টোরির স্থায়িত্বকাল (Expiry Hours):</label>
                    <input
                      type="number"
                      value={config.storyExpiryHours}
                      onChange={(e) => setConfig({ ...config, storyExpiryHours: parseInt(e.target.value) || 24 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">সর্বোচ্চ ভিডিও স্টোরি সেকেন্ড সীমা:</label>
                    <input
                      type="number"
                      value={config.maxStoryDurationSeconds}
                      onChange={(e) => setConfig({ ...config, maxStoryDurationSeconds: parseInt(e.target.value) || 30 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.allowStoryReplies}
                      onChange={(e) => setConfig({ ...config, allowStoryReplies: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">স্টোরিতে ইনবক্স রিপ্লাই ও মেসেজিং সুবিধা চালু রাখুন</span>
                  </label>
                </div>
              </div>
            )}

            {/* 6. Messenger Settings */}
            {activeTab === 'messenger' && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <MessageCircle className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">৬. Messenger Settings (মেসেঞ্জার সেটিংস)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">মেসেজ ডিলিট করার সর্বোচ্চ সময়সীমা (Mins):</label>
                    <input
                      type="number"
                      value={config.messageDeleteWindowMinutes}
                      onChange={(e) => setConfig({ ...config, messageDeleteWindowMinutes: parseInt(e.target.value) || 15 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">ইনবক্স ফাইল অ্যাটাচমেন্ট সর্বোচ্চ ফাইল সাইজ (MB):</label>
                    <input
                      type="number"
                      value={config.maxChatAttachmentSizeMB}
                      onChange={(e) => setConfig({ ...config, maxChatAttachmentSizeMB: parseInt(e.target.value) || 25 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.allowDirectMessagesFromNonFriends}
                      onChange={(e) => setConfig({ ...config, allowDirectMessagesFromNonFriends: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">অপরিচিত ব্যক্তিদের থেকে সরাসরি ইনবক্স মেসেজ গ্রহণ চালু রাখুন</span>
                  </label>
                </div>
              </div>
            )}

            {/* 7. Call Settings */}
            {activeTab === 'calls' && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <PhoneCall className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">৭. Call Settings (কল সেটিংস)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">সর্বোচ্চ কল সময়সীমা (Minutes):</label>
                    <input
                      type="number"
                      value={config.maxCallDurationMinutes}
                      onChange={(e) => setConfig({ ...config, maxCallDurationMinutes: parseInt(e.target.value) || 60 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">কল কোয়ালিটি প্রিসেট:</label>
                    <select
                      value={config.callQualityPreset}
                      onChange={(e) => setConfig({ ...config, callQualityPreset: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    >
                      <option value="low">লো ডাটা মোড (কম ব্যান্ডউইথ)</option>
                      <option value="medium">স্ট্যান্ডার্ড মোড (ভারসাম্যপূর্ণ)</option>
                      <option value="hd">এইচডি মোড (উচ্চ কোয়ালিটি)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableAudioCalling}
                      onChange={(e) => setConfig({ ...config, enableAudioCalling: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">অডিও কলিং (Voice Call) সার্ভিস চালু রাখুন</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableVideoCalling}
                      onChange={(e) => setConfig({ ...config, enableVideoCalling: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">ভিডিও কলিং (Video Call) সার্ভিস চালু রাখুন</span>
                  </label>
                </div>
              </div>
            )}

            {/* 8. Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Bell className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">৮. Notification Settings (নোটিফিকেশন সেটিংস)</h3>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enablePushNotifications}
                      onChange={(e) => setConfig({ ...config, enablePushNotifications: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">রিয়েলটাইম ওয়েভ / মোবাইল পুশ নোটিফিকেশন চালু রাখুন</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableEmailDigests}
                      onChange={(e) => setConfig({ ...config, enableEmailDigests: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">গুরুত্বপূর্ণ আপডেট ও নোটিশ ইমেইল ডাইজেস্ট সার্ভিস চালু রাখুন</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableSmsUrgentAlerts}
                      onChange={(e) => setConfig({ ...config, enableSmsUrgentAlerts: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">জরুরি সিকিউরিটি ও সিস্টেম এলার্ট এসএমএস সংকেত চালু রাখুন</span>
                  </label>
                </div>
              </div>
            )}

            {/* 9. Privacy Defaults */}
            {activeTab === 'privacy' && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Lock className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">৯. Privacy Defaults (প্রাইভেসি ডিফল্টস)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">নতুন পোস্টের ডিফল্ট প্রাইভেসি:</label>
                    <select
                      value={config.defaultPostPrivacy}
                      onChange={(e) => setConfig({ ...config, defaultPostPrivacy: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    >
                      <option value="public">পাবলিক (Public)</option>
                      <option value="friends">শুধু বন্ধুরা (Friends Only)</option>
                      <option value="private">শুধুমাত্র আমি (Only Me)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">প্রোফাইল ডিফল্ট দৃশ্যমানতা:</label>
                    <select
                      value={config.defaultProfileVisibility}
                      onChange={(e) => setConfig({ ...config, defaultProfileVisibility: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    >
                      <option value="public">সকলের জন্য উন্মুক্ত</option>
                      <option value="verified_only">শুধু ভেরিফাইড ইউজারদের জন্য</option>
                      <option value="private">গোপন প্রোফাইল</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.allowSearchEngineIndexing}
                      onChange={(e) => setConfig({ ...config, allowSearchEngineIndexing: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">পাবলিক কন্টেন্ট গুগল ও সার্চ ইঞ্জিনে ইনডেক্সিং এর অনুমতি দিন</span>
                  </label>
                </div>
              </div>
            )}

            {/* 10. Upload Limits */}
            {activeTab === 'uploads' && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <UploadCloud className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">১০. Upload Limits (আপলোড লিমিট)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">ছবি সর্বোচ্চ ফাইল সাইজ (MB):</label>
                    <input
                      type="number"
                      value={config.maxImageSizeMB}
                      onChange={(e) => setConfig({ ...config, maxImageSizeMB: parseInt(e.target.value) || 10 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">ছবি কম্প্রেশন কোয়ালিটি (%):</label>
                    <input
                      type="number"
                      value={config.imageCompressionQualityPercent}
                      onChange={(e) => setConfig({ ...config, imageCompressionQualityPercent: parseInt(e.target.value) || 80 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">দৈনিক সর্বোচ্চ ফাইল আপলোড সীমাবদ্ধতা:</label>
                    <input
                      type="number"
                      value={config.maxUploadsPerUserPerDay}
                      onChange={(e) => setConfig({ ...config, maxUploadsPerUserPerDay: parseInt(e.target.value) || 50 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 11. Video Limits */}
            {activeTab === 'videos' && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Video className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">১১. Video Limits (ভিডিও লিমিট)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">ভিডিও সর্বোচ্চ সময়সীমা (Seconds):</label>
                    <input
                      type="number"
                      value={config.maxVideoDurationSeconds}
                      onChange={(e) => setConfig({ ...config, maxVideoDurationSeconds: parseInt(e.target.value) || 300 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">ভিডিও সর্বোচ্চ সাইজ (MB):</label>
                    <input
                      type="number"
                      value={config.maxVideoSizeMB}
                      onChange={(e) => setConfig({ ...config, maxVideoSizeMB: parseInt(e.target.value) || 100 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">রিলস (Reels) সর্বোচ্চ সময়সীমা (Seconds):</label>
                    <input
                      type="number"
                      value={config.maxReelDurationSeconds}
                      onChange={(e) => setConfig({ ...config, maxReelDurationSeconds: parseInt(e.target.value) || 60 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableHdVideoStreaming}
                      onChange={(e) => setConfig({ ...config, enableHdVideoStreaming: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">এইচডি (HD 1080p) ভিডিও স্ট্রিমিং ও প্লেব্যাক অপটিমাইজেশন চালু রাখুন</span>
                  </label>
                </div>
              </div>
            )}

            {/* 12. Report Settings */}
            {activeTab === 'reports' && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Flag className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">১২. Report Settings (রিপোর্ট সেটিংস)</h3>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">স্বয়ংক্রিয় কন্টেন্ট হাইড রিপোর্ট থ্রেশহোল্ড (কয়টি রিপোর্টে হাইড হবে):</label>
                  <input
                    type="number"
                    value={config.autoHideReportThresholdCount}
                    onChange={(e) => setConfig({ ...config, autoHideReportThresholdCount: parseInt(e.target.value) || 5 })}
                    className="w-full sm:w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">রিপোর্টের অনুমোদিত কারণসমূহ (কমা দিয়ে লিখুন):</label>
                  <input
                    type="text"
                    value={config.reportReasonsList.join(', ')}
                    onChange={(e) => setConfig({ ...config, reportReasonsList: e.target.value.split(',').map(s => s.trim()) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoNotifyAdminsOnCriticalReport}
                      onChange={(e) => setConfig({ ...config, autoNotifyAdminsOnCriticalReport: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                    />
                    <span className="text-xs font-bold text-slate-800">ক্রিটিক্যাল রিপোর্টে এডমিন ও মডারেটরদের তাৎক্ষণিক ইমার্জেন্সি এলার্ট দিন</span>
                  </label>
                </div>
              </div>
            )}

            {/* 13. Moderation Settings */}
            {activeTab === 'moderation' && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <ShieldCheck className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">১৩. Moderation Settings (মডারেশন সেটিংস)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">এআই স্প্যাম ফিল্টার সংবেদনশীলতা (Sensitivity):</label>
                    <select
                      value={config.aiSpamFilterSensitivity}
                      onChange={(e) => setConfig({ ...config, aiSpamFilterSensitivity: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    >
                      <option value="low">কম (Low Filtering)</option>
                      <option value="medium">মাঝারি (Standard Dynamic)</option>
                      <option value="strict">কঠোর (Strict Zero-Spam)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">বারবার অপরাধকারী ইউজারের স্বয়ংক্রিয় সাসপেনশন (দিন):</label>
                    <input
                      type="number"
                      value={config.autoSuspendRepeatOffendersDays}
                      onChange={(e) => setConfig({ ...config, autoSuspendRepeatOffendersDays: parseInt(e.target.value) || 7 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">নিষিদ্ধ কি-ওয়ার্ড ফিল্টার লিস্ট (কমা দিয়ে পৃথক করুন):</label>
                  <textarea
                    rows={3}
                    value={config.blockedKeywordsText}
                    onChange={(e) => setConfig({ ...config, blockedKeywordsText: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                    placeholder="ব্লক করতে চাওয়া কি-ওয়ার্ডসমূহ..."
                  />
                </div>
              </div>
            )}

            {/* Save Button Bar */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">
                * সেটিংস পরিবর্তনের সাথে সাথে ক্লায়েন্টে রিয়েল-টাইমে আপডেট কার্যকর হয়
              </span>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-2xl text-xs font-black shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} />
                <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সেভ করুন'}</span>
              </button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
};

export default AddaSystemSettings;
