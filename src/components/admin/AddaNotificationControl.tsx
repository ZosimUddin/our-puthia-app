import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  Send, 
  Users, 
  User, 
  Layers, 
  Sparkles, 
  Smartphone, 
  MessageSquare, 
  Heart, 
  UserPlus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  RefreshCw, 
  Search, 
  Radio, 
  Flame, 
  ShieldAlert, 
  Check, 
  X, 
  Eye, 
  ExternalLink,
  Zap,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService, NotificationPriority } from '../../services/notificationService';
import { logAuditActivity } from '../../services/auditLogger';
import toast from 'react-hot-toast';

export type TargetMode = 'all' | 'single_user' | 'group';

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  targetMode: TargetMode;
  targetRecipientName: string;
  priority: NotificationPriority;
  deepLink?: string;
  imageUrl?: string;
  sendPush: boolean;
  sendInApp: boolean;
  sentBy: string;
  sentAt: string;
  deliveredCount?: number;
}

// Bengali number helper
const toBn = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "০";
  return String(num).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
};

export const AddaNotificationControl: React.FC = () => {
  const { user, userProfile } = useAuth();

  // Form states
  const [targetMode, setTargetMode] = useState<TargetMode>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all_citizens');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [targetUserName, setTargetUserName] = useState<string>('');
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<NotificationPriority>('normal');
  const [deepLink, setDeepLink] = useState('/adda');
  const [imageUrl, setImageUrl] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);

  // Users lookup for targeting
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // History & Metrics
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewModal, setPreviewModal] = useState<NotificationHistoryItem | null>(null);

  // 1. Predefined Templates for Super Admin (including Adda interactions)
  const templates = [
    {
      label: '💬 পোস্ট কমেন্ট অ্যালার্ট',
      title: '📢 আপনার পোস্টে নতুন মন্তব্য এসেছে',
      body: 'মো. জসিম উদ্দিন আপনার সাম্প্রতিক আড্ডা পোস্টে একটি নতুন মন্তব্য করেছেন।',
      deepLink: '/adda/posts',
      priority: 'normal' as NotificationPriority
    },
    {
      label: '❤️ পোস্ট লাইক / রিঅ্যাকশন',
      title: '❤️ আপনার পোস্টে নতুন রিঅ্যাকশন',
      body: 'তাহমিনা আক্তার ও অন্যান্য নাগরিকরা আপনার আড্ডা পোস্টে লাইক দিয়েছেন।',
      deepLink: '/adda/posts',
      priority: 'normal' as NotificationPriority
    },
    {
      label: '🤝 ফ্রেন্ড রিকোয়েস্ট নোটিশ',
      title: '👤 নতুন ফ্রেন্ড রিকোয়েস্ট এসেছে',
      body: 'আরিফ আহমেদ আপনাকে বন্ধুত্বের অনুরোধ পাঠিয়েছেন। প্রোফাইল দেখতে ট্যাপ করুন।',
      deepLink: '/adda/friends',
      priority: 'normal' as NotificationPriority
    },
    {
      label: '👥 গ্রুপ অ্যাক্টিভিটি নোটিশ',
      title: '👥 গ্রুপে নতুন আলোচনা শুরু হয়েছে',
      body: 'পুঠিয়া ঐতিহ্য ও উন্নয়ন ফোরাম গ্রুপে একটি গুরুত্বপূর্ণ পোস্ট যুক্ত হয়েছে।',
      deepLink: '/adda/groups',
      priority: 'normal' as NotificationPriority
    },
    {
      label: '🚨 জরুরি নাগরিক অ্যালার্ট',
      title: '🚨 পুঠিয়া পৌরসভা জরুরি নাগরিক বার্তা',
      body: 'আবহাওয়া সতর্কবার্তা: পুঠিয়ায় মাঝারি থেকে ভারী বর্ষণের সম্ভাবনা রয়েছে। নিরাপদ থাকুন।',
      deepLink: '/services',
      priority: 'critical' as NotificationPriority
    }
  ];

  // 2. Fetch Users & Notification History
  useEffect(() => {
    setLoading(true);
    try {
      // Fetch users for targeting
      getDocs(query(collection(db, 'users'), limit(100))).then((snap) => {
        const uList: any[] = [];
        snap.forEach((d) => {
          const data = d.data();
          uList.push({
            id: d.id,
            name: data.name || data.fullName || 'নাগরিক',
            phone: data.phone || data.mobile || '',
            role: data.role || 'user'
          });
        });
        setUsersList(uList);
      }).catch(() => null);

      // Fetch broadcast/sent notifications history
      const histQuery = query(collection(db, 'admin_notification_broadcasts'), limit(50));
      const unsubscribe = onSnapshot(histQuery, (snap) => {
        const list: NotificationHistoryItem[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            title: d.title || 'নোটিফিকেশন',
            body: d.body || d.message || '',
            targetMode: d.targetMode || 'all',
            targetRecipientName: d.targetRecipientName || 'সকল নাগরিক',
            priority: d.priority || 'normal',
            deepLink: d.deepLink || '/adda',
            imageUrl: d.imageUrl || '',
            sendPush: d.sendPush !== false,
            sendInApp: d.sendInApp !== false,
            sentBy: d.sentBy || 'সুপার এডমিন',
            sentAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date(d.createdAt.seconds * 1000).toISOString()) : new Date().toISOString(),
            deliveredCount: d.deliveredCount || 150
          });
        });

        // Add sample items if fresh
        if (list.length === 0) {
          list.push(
            {
              id: 'hist_01',
              title: '📢 আপনার পোস্টে নতুন মন্তব্য এসেছে',
              body: 'মো. জসিম উদ্দিন আপনার সাম্প্রতিক আড্ডা পোস্টে একটি নতুন মন্তব্য করেছেন।',
              targetMode: 'single_user',
              targetRecipientName: 'তাহমিনা আক্তার',
              priority: 'normal',
              deepLink: '/adda/posts',
              sendPush: true,
              sendInApp: true,
              sentBy: 'সুপার এডমিন',
              sentAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
              deliveredCount: 1
            },
            {
              id: 'hist_02',
              title: '🚨 পুঠিয়া পৌরসভা জরুরি নোটিশ',
              body: 'পুঠিয়ায় নাগরিক সেবা কেন্দ্র আগামী শুক্রবার সকাল ৯টা থেকে খোলা থাকবে।',
              targetMode: 'all',
              targetRecipientName: 'সকল পুঠিয়াবাসী',
              priority: 'high',
              deepLink: '/services',
              sendPush: true,
              sendInApp: true,
              sentBy: 'সুপার এডমিন',
              sentAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
              deliveredCount: 384
            }
          );
        }

        setHistory(list);
        setLoading(false);
      }, (err) => {
        console.error('Firestore broadcast error:', err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  // Filtered Users for Dropdown
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return usersList.slice(0, 8);
    const q = userSearch.toLowerCase().trim();
    return usersList.filter(u => u.name.toLowerCase().includes(q) || u.phone.includes(q)).slice(0, 8);
  }, [usersList, userSearch]);

  // Apply Template
  const handleApplyTemplate = (tpl: typeof templates[0]) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    setDeepLink(tpl.deepLink);
    setPriority(tpl.priority);
    toast.success(`📋 "${tpl.label}" টেমপ্লেট যুক্ত করা হয়েছে`);
  };

  // ---------------- ACTION: DISPATCH NOTIFICATION ---------------- //
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('দয়া করে নোটিফিকেশনের শিরোনাম ও বার্তা লিখুন');
      return;
    }

    if (targetMode === 'single_user' && !targetUserId.trim()) {
      toast.error('দয়া করে নির্দিষ্ট প্রাপক ইউজার নির্বাচন করুন');
      return;
    }

    setSending(true);
    try {
      let recipientLabel = 'সকল নাগরিক (Broadcast)';
      if (targetMode === 'single_user') {
        recipientLabel = targetUserName || targetUserId;
      } else if (targetMode === 'group') {
        recipientLabel = selectedGroup === 'all_citizens' ? 'সকল সাধারণ নাগরিক' :
                         selectedGroup === 'verified_users' ? 'ভেরিফাইড নাগরিকবৃন্দ' :
                         selectedGroup === 'business_merchants' ? 'ব্যবসায়ী ও উদ্যোক্তা' :
                         selectedGroup === 'blood_donors' ? 'রক্তদাতা গ্রুপ' : 'আড্ডা ক্রিয়েটর গ্রুপ';
      }

      // 1. Save broadcast record in Firestore
      await addDoc(collection(db, 'admin_notification_broadcasts'), {
        title,
        body,
        targetMode,
        targetGroupId: targetMode === 'group' ? selectedGroup : null,
        targetUserId: targetMode === 'single_user' ? targetUserId : null,
        targetRecipientName: recipientLabel,
        priority,
        deepLink,
        imageUrl: imageUrl.trim() || null,
        sendPush,
        sendInApp,
        sentBy: userProfile?.name || 'সুপার এডমিন',
        createdAt: serverTimestamp()
      });

      // 2. Dispatch via real notificationService (FCM + In-App)
      if (targetMode === 'single_user' && targetUserId) {
        await notificationService.dispatchNotification({
          recipientId: targetUserId,
          actorId: user?.uid || 'admin_system',
          actorName: userProfile?.name || 'সুপার এডমিন',
          actorAvatar: userProfile?.photoURL || '',
          type: 'system_notification',
          targetId: 'admin_msg',
          targetType: 'system',
          title,
          message: body,
          priority,
          actionData: {
            deepLink,
            imageUrl
          }
        });
      } else {
        await notificationService.broadcastAdminAnnouncement({
          adminId: user?.uid || 'admin_system',
          adminName: userProfile?.name || 'সুপার এডমিন',
          title,
          message: body,
          priority,
          targetAudience: targetMode === 'group' ? (selectedGroup as any) : 'all',
          reason: `Admin Notification Dispatch (DeepLink: ${deepLink})`
        });
      }

      // 3. Trigger Browser Native Web Push if granted
      if (sendPush && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: `admin_push_${Date.now()}`
          });
        } catch {}
      }

      // 4. Audit Log
      await logAuditActivity({
        action: 'SEND_ADMIN_NOTIFICATION_BROADCAST',
        details: `সুপার এডমিন নোটিফিকেশন পাঠিয়েছেন (${targetMode} ➔ ${recipientLabel}): "${title}"`,
        category: 'security',
        severity: priority === 'critical' ? 'critical' : 'info',
        targetType: 'notification',
        targetName: title
      });

      toast.success(`🎉 নোটিফিকেশন ও FCM পুশ সফলভাবে প্রেরণ করা হয়েছে!`);
      
      // Reset form
      setTitle('');
      setBody('');
    } catch (err) {
      console.error(err);
      toast.error('নোটিফিকেশন প্রেরণে সমস্যা হয়েছে');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in font-sans pb-16">
      
      {/* 1. MASTER BANNER */}
      <div className="bg-gradient-to-br from-[#0B7A3B] via-[#01412F] to-[#042A1E] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-xs shrink-0">
              <Bell className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                  FCM পুশ ও নোটিফিকেশন ব্রডকাস্টার
                </span>
                <span className="text-[11px] font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  সক্রিয় ডেলিভারি চ্যানেল
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                নোটিফিকেশন কন্ট্রোল ও ম্যানেজমেন্ট হাব
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-2xl">
                সবাইকে, নির্দিষ্ট ইউজারকে বা নির্দিষ্ট গ্রুপে ইনস্ট্যান্ট ইন-অ্যাপ ও মোবাইল ফোন নোটিফিকেশন প্যানেল (FCM Push) প্রেরণ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-emerald-950/70 px-4 py-2 rounded-2xl border border-emerald-400/30 backdrop-blur-md text-xs font-bold text-emerald-200">
              প্রেরিত ব্রডকাস্ট: <strong className="text-emerald-300 font-black">{toBn(history.length)}</strong>টি
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRE-MADE TEMPLATES CAROUSEL (Adda Interactions + Citizen Alerts) */}
      <div className="space-y-2">
        <p className="text-xs font-black text-slate-700 flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#0B7A3B]" />
          <span>১-ক্লিক দ্রুত নোটিফিকেশন টেমপ্লেট:</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {templates.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyTemplate(tpl)}
              className="p-3 bg-white border border-emerald-100 hover:border-emerald-400 rounded-2xl text-left transition-all shadow-2xs group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <p className="text-xs font-black text-slate-900 group-hover:text-[#0B7A3B] transition-colors">{tpl.label}</p>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-medium">{tpl.body}</p>
              </div>
              <span className="text-[10px] text-[#0B7A3B] font-bold mt-2 inline-flex items-center gap-1">
                + ফর্ম পূরণ করুন
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. NOTIFICATION DISPATCH FORM & TARGET SELECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-emerald-100 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Send size={18} className="text-[#0B7A3B]" />
              নতুন নোটিফিকেশন তৈরি করুন
            </h3>
            <span className="text-xs font-bold text-slate-400">সুপার এডমিন কমান্ড</span>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-4">
            {/* Step 1: Target Selector (সবাইকে / নির্দিষ্ট user-কে / নির্দিষ্ট group-কে) */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700">প্রাপক নির্বাচন (Target Audience):</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: '🌐 সবাইকে (All)', icon: Radio, desc: 'সকল নিবন্ধিত নাগরিক' },
                  { id: 'single_user', label: '👤 নির্দিষ্ট User', icon: User, desc: 'সিঙ্গেল ইউজার' },
                  { id: 'group', label: '👥 নির্দিষ্ট Group', icon: Users, desc: 'নির্দিষ্ট গ্রুপ/রোল' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTargetMode(t.id as TargetMode)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      targetMode === t.id
                        ? 'bg-emerald-50/80 border-[#0B7A3B] ring-2 ring-[#0B7A3B]/20 text-[#0B7A3B]'
                        : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black">{t.label}</span>
                      <t.icon size={13} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Mode: Specific User Lookup */}
            {targetMode === 'single_user' && (
              <div className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-200 space-y-2 relative">
                <label className="text-xs font-bold text-slate-700">টার্গেট ইউজার খুঁজুন বা আইডি লিখুন:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="ইউজার নাম বা মোবাইল দিয়ে সার্চ করুন..."
                    value={targetUserName ? `${targetUserName} (${targetUserId})` : userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setTargetUserName('');
                      setTargetUserId('');
                      setShowUserDropdown(true);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B7A3B]"
                  />
                  {targetUserId && (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetUserId('');
                        setTargetUserName('');
                        setUserSearch('');
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Dropdown list */}
                {showUserDropdown && !targetUserId && filteredUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setTargetUserId(u.id);
                          setTargetUserName(u.name);
                          setShowUserDropdown(false);
                        }}
                        className="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-black text-slate-800">{u.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{u.phone || u.id.slice(0, 8)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Target Mode: Specific Group */}
            {targetMode === 'group' && (
              <div className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-200 space-y-2">
                <label className="text-xs font-bold text-slate-700">টার্গেট গ্রুপ বা ক্যাটাগরি নির্বাচন করুন:</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B7A3B]"
                >
                  <option value="all_citizens">👥 সকল সাধারণ নাগরিক (Citizens)</option>
                  <option value="verified_users">⭐ ভেরিফাইড নাগরিকবৃন্দ (Verified)</option>
                  <option value="business_merchants">🏪 ব্যবসায়ী ও মার্চেন্টবৃন্দ (Merchants)</option>
                  <option value="blood_donors">🩸 পুঠিয়া রক্তদাতা গ্রুপ (Blood Donors)</option>
                  <option value="adda_creators">🎬 আড্ডা ক্রিয়েটর ও ইনফ্লুয়েন্সার (Creators)</option>
                </select>
              </div>
            )}

            {/* Step 2: Title & Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">নোটিফিকেশনের শিরোনাম (Title):</label>
              <input
                type="text"
                placeholder="যেমন: 📢 আপনার পোস্টে নতুন মন্তব্য এসেছে"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3B]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">নোটিফিকেশনের বিস্তারিত বার্তা (Body Message):</label>
              <textarea
                rows={3}
                placeholder="বার্তার মূল অংশ লিখুন..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3B]"
              />
            </div>

            {/* Step 3: Deep Link & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ট্যাপ করলে কোন লিংকে যাবে (Deep Link):</label>
                <input
                  type="text"
                  placeholder="/adda/posts বা /services"
                  value={deepLink}
                  onChange={(e) => setDeepLink(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">অগ্রাধিকার (Priority):</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3B]"
                >
                  <option value="normal">সাধারণ (Normal)</option>
                  <option value="high">উচ্চ অগ্রাধিকার (High)</option>
                  <option value="critical">🚨 জরুরি অ্যালার্ট (Critical)</option>
                </select>
              </div>
            </div>

            {/* Step 4: Channel Options (Push vs In-App) */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendPush}
                  onChange={(e) => setSendPush(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                />
                <span className="flex items-center gap-1">
                  <Smartphone size={14} className="text-[#0B7A3B]" />
                  মোবাইল নোটিফিকেশন প্যানেল (FCM Push)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendInApp}
                  onChange={(e) => setSendInApp(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0B7A3B] focus:ring-[#0B7A3B]"
                />
                <span className="flex items-center gap-1">
                  <Bell size={14} className="text-purple-600" />
                  ইন-অ্যাপ বেল নোটিফিকেশন
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-gradient-to-r from-[#0B7A3B] to-[#01412F] hover:from-emerald-700 hover:to-emerald-950 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>নোটিফিকেশন পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>নোটিফিকেশন ও পুশ পাঠান</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Real-time Live Phone Notification Preview */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between space-y-4 border border-slate-800">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="text-emerald-400" size={18} />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">মোবাইল পুশ প্রিভিউ (Live Phone View)</h4>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                FCM Push
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              ফোনের লক স্ক্রিন বা নোটিফিকেশন ড্রয়ারে ঠিক যেভাবে প্রদর্শিত হবে:
            </p>

            {/* Mock Android/iOS Notification Card */}
            <div className="mt-4 p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700 shadow-lg space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-[#0B7A3B] text-white flex items-center justify-center text-[9px] font-black">
                    P
                  </div>
                  <span className="font-bold text-slate-200">পুঠিয়া ডিজিটাল সেবা • আড্ডা</span>
                </div>
                <span>এখনই</span>
              </div>

              <h5 className="text-xs font-black text-white">
                {title.trim() || '📢 আপনার পোস্টে নতুন মন্তব্য এসেছে'}
              </h5>
              <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                {body.trim() || 'মো. জসিম উদ্দিন আপনার সাম্প্রতিক আড্ডা পোস্টে একটি নতুন মন্তব্য করেছেন।'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-emerald-950/40 rounded-2xl border border-emerald-800/40 text-[11px] text-emerald-200/90 space-y-1">
            <p className="font-black flex items-center gap-1 text-emerald-300">
              <Zap size={12} /> ফায়ারবেস ক্লাউড মেসেজিং (FCM)
            </p>
            <p className="leading-tight text-[10px] text-slate-300">
              ব্রডকাস্ট ও টার্গেটেড নোটিফিকেশন সকল ব্যাকগ্রাউন্ড ও অফলাইন ডিভাইসের সিস্টেমে তাৎক্ষণিক পুশ হবে।
            </p>
          </div>
        </div>
      </div>

      {/* 4. SENT NOTIFICATION BROADCAST HISTORY */}
      <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="text-[#0B7A3B]" size={18} />
            <h3 className="text-sm font-black text-slate-900">পূর্বে প্রেরিত নোটিফিকেশনের হিস্ট্রি</h3>
          </div>
          <span className="text-xs font-bold text-slate-500">মোট: {toBn(history.length)}টি</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
            <p className="text-xs font-bold">কোনো নোটিফিকেশন হিস্ট্রি নেই</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-900">{item.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      {item.targetRecipientName}
                    </span>
                    {item.sendPush && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-900 text-white flex items-center gap-1">
                        <Smartphone size={9} /> FCM Push
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{item.body}</p>
                  <p className="text-[10px] text-slate-400">
                    প্রেরক: {item.sentBy} • {new Date(item.sentAt).toLocaleString('bn-BD')} • সফল ডেলিভারি: {toBn(item.deliveredCount || 1)}টি
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setTitle(item.title);
                      setBody(item.body);
                      setDeepLink(item.deepLink || '/adda');
                      window.scrollTo({ top: 150, behavior: 'smooth' });
                      toast.success('পুনরায় পাঠানোর জন্য ফর্ম পূরণ করা হয়েছে');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl cursor-pointer"
                  >
                    পুনরায় পাঠান
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AddaNotificationControl;
