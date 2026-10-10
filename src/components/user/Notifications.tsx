import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { 
  Check, 
  Trash2, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  UserCheck, 
  AtSign, 
  Users, 
  Flag, 
  ChevronLeft, 
  Search, 
  X, 
  MoreHorizontal, 
  Cake, 
  ThumbsUp, 
  Settings, 
  ShieldAlert, 
  BellOff, 
  Bell, 
  SlidersHorizontal,
  Eye,
  EyeOff,
  CheckCheck
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications, AppNotification, NotificationType } from "../../contexts/NotificationContext";
import { isYesterday } from 'date-fns';
import { toast } from "sonner";

// Helper: Convert English digits to Bengali digits
const toBengaliNumber = (num: number | string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().split('').map(digit => {
    const parsed = parseInt(digit, 10);
    return isNaN(parsed) ? digit : bengaliDigits[parsed];
  }).join('');
};

interface NotificationsProps {
  hideHeader?: boolean;
}

export const Notifications: React.FC<NotificationsProps> = ({ hideHeader = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { 
    notifications, 
    preferences,
    updatePreferences,
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    respondToFriendRequest,
    toggleFollowBack
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'security'>('all');
  const [selectedMenuNotif, setSelectedMenuNotif] = useState<AppNotification | null>(null);
  const [viewDetailNotif, setViewDetailNotif] = useState<AppNotification | null>(null);
  const [userPhotosMap, setUserPhotosMap] = useState<Record<string, string>>({});
  const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set());

  // Dynamically resolve real user profile photos from Firestore for any notifications
  useEffect(() => {
    const missingUids = notifications
      .map(n => n.actorId || (n.actionData as any)?.senderId)
      .filter(Boolean)
      .filter(uid => uid !== 'user' && uid !== 'system' && !userPhotosMap[uid]);

    const uniqueUids = Array.from(new Set(missingUids)).slice(0, 30);
    if (uniqueUids.length === 0) return;

    uniqueUids.forEach(async (uid) => {
      try {
        const uSnap = await getDoc(doc(db, "users", uid));
        if (uSnap.exists()) {
          const uData = uSnap.data();
          const photo = uData.photoURL || uData.photoUrl || uData.avatarUrl || uData.photo || '';
          if (photo && !photo.includes('dicebear')) {
            setUserPhotosMap(prev => ({ ...prev, [uid]: photo }));
          }
        }
      } catch (err) {
        // silent
      }
    });
  }, [notifications]);

  // Accurate Bengali Relative / Formatted Timestamp
  const getBengaliTime = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMinutes = Math.max(1, Math.floor(diffInMs / (1000 * 60)));
        return `${toBengaliNumber(diffInMinutes)} মিনিট আগে`;
      }
      if (diffInHours < 24) {
        return `${toBengaliNumber(Math.floor(diffInHours))} ঘণ্টা আগে`;
      }
      
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeStr = `${toBengaliNumber(hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours))}:${toBengaliNumber(minutes)} ${hours >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন'}`;

      if (isYesterday(date)) {
        return `গতকাল ${timeStr}`;
      }

      const day = date.getDate();
      const bengaliMonths = [
        "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", 
        "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
      ];
      const month = bengaliMonths[date.getMonth()];

      if (date.getFullYear() === now.getFullYear()) {
        return `${toBengaliNumber(day)} ${month}, ${timeStr}`;
      }
      return `${toBengaliNumber(day)} ${month} ${toBengaliNumber(date.getFullYear())}, ${timeStr}`;
    } catch {
      return 'সম্প্রতি';
    }
  };

  // Clean and localize notification messages
  const cleanBengaliMessage = (msg?: string) => {
    if (!msg) return '';
    return msg
      .replace(/Privacy Setting/gi, 'প্রাইভেসী সেটিংস')
      .replace(/Privacy Settings/gi, 'প্রাইভেসী সেটিংস')
      .replace(/reacted to your post/gi, 'আপনার পোস্টে রিঅ্যাক্ট করেছেন')
      .replace(/commented on your post/gi, 'আপনার পোস্টে মন্তব্য করেছেন')
      .replace(/sent you a friend request/gi, 'আপনাকে ফ্রেন্ড রিকোয়েস্ট পাঠিয়েছেন')
      .replace(/accepted your friend request/gi, 'আপনার ফ্রেন্ড রিকোয়েস্ট গ্রহণ করেছেন')
      .replace(/started following you/gi, 'আপনাকে ফলো করা শুরু করেছেন');
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }

    const actorUid = notif.actorId || notif.actionData?.senderId || notif.targetId;
    const msg = (notif.message || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();

    // Check if Privacy / Settings / Account related
    if (
      msg.includes('privacy') || 
      msg.includes('প্রাইভেসি') || 
      msg.includes('setting') || 
      msg.includes('সেটিং') || 
      title.includes('privacy') || 
      title.includes('সেটিং')
    ) {
      navigate('/settings');
      return;
    }

    if (notif.actionData?.deepLink) {
      navigate(notif.actionData.deepLink);
      return;
    }

    switch (notif.type) {
      case 'friend_request':
      case 'friend_request_accepted':
      case 'follow':
      case 'birthday':
        if (actorUid) {
          navigate(`/profile/${actorUid}`);
        } else {
          navigate('/friends');
        }
        break;

      case 'reaction':
      case 'comment':
      case 'reply':
      case 'mention':
        if (notif.targetId) {
          navigate(`/adda?post=${notif.targetId}`);
        } else {
          navigate('/adda');
        }
        break;

      case 'message':
        if (actorUid) {
          navigate(`/messages?chat=${actorUid}`);
        } else {
          navigate('/messages');
        }
        break;

      default:
        if (actorUid && actorUid !== 'system_broadcast') {
          navigate(`/profile/${actorUid}`);
        } else {
          setViewDetailNotif(notif);
        }
        break;
    }
  };

  const handleBack = () => {
    try {
      const fromPath = (location.state as any)?.from;
      if (fromPath && typeof fromPath === 'string' && fromPath !== '/notifications') {
        navigate(fromPath);
        return;
      }
    } catch (e) {
      console.warn("Back navigation error:", e);
    }

    if (window.history.length > 1 && location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/adda');
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success("সবগুলো নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করা হয়েছে");
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Filter tab check
      if (activeFilter === 'unread' && n.read) return false;
      if (activeFilter === 'security' && n.type !== 'security_alert' && n.priority !== 'critical') return false;

      // Search term check
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (n.actorName || '').toLowerCase().includes(q);
        const matchMsg = (n.message || '').toLowerCase().includes(q);
        const matchTitle = (n.title || '').toLowerCase().includes(q);
        return matchName || matchMsg || matchTitle;
      }
      return true;
    });
  }, [notifications, searchTerm, activeFilter]);

  // Group notifications into "New" (unread) and "Earlier" (read) in Bengali
  const notificationSections = useMemo(() => {
    const newNotifications: AppNotification[] = [];
    const earlierNotifications: AppNotification[] = [];

    filteredNotifications.forEach(n => {
      if (!n.read) {
        newNotifications.push(n);
      } else {
        earlierNotifications.push(n);
      }
    });

    return {
      new: newNotifications,
      earlier: earlierNotifications
    };
  }, [filteredNotifications]);

  // Overlapping Category Badge with vibrant Green/Adda Color Palette
  const getBadgeIcon = (type: NotificationType) => {
    switch (type) {
      case 'friend_request':
      case 'friend_request_accepted':
      case 'follow':
        return (
          <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-[#0B7A3B] text-white flex items-center justify-center border-2 border-white shadow-xs">
            <UserCheck size={11} className="stroke-[2.5]" />
          </div>
        );
      case 'birthday':
        return (
          <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-[#E91E63] text-white flex items-center justify-center border-2 border-white shadow-xs">
            <Cake size={11} className="stroke-[2.5]" />
          </div>
        );
      case 'page_activity':
        return (
          <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-[#059669] text-white flex items-center justify-center border-2 border-white shadow-xs">
            <Flag size={11} className="fill-white stroke-[2]" />
          </div>
        );
      case 'group_activity':
        return (
          <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-[#0284C7] text-white flex items-center justify-center border-2 border-white shadow-xs">
            <Users size={11} className="stroke-[2.5]" />
          </div>
        );
      case 'reaction':
        return (
          <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-rose-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
            <Heart size={11} className="fill-white stroke-none" />
          </div>
        );
      case 'comment':
      case 'reply':
        return (
          <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-[#10B981] text-white flex items-center justify-center border-2 border-white shadow-xs">
            <MessageSquare size={11} className="fill-white stroke-none" />
          </div>
        );
      case 'mention':
        return (
          <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-[#D97706] text-white flex items-center justify-center border-2 border-white shadow-xs">
            <AtSign size={11} className="stroke-[2.5]" />
          </div>
        );
      case 'security_alert':
        return (
          <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
            <ShieldAlert size={11} className="stroke-[2.5]" />
          </div>
        );
      default:
        return (
          <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-[#0B7A3B] text-white flex items-center justify-center border-2 border-white shadow-xs">
            <Bell size={11} className="stroke-[2.5]" />
          </div>
        );
    }
  };

  const renderNotificationItem = (notif: AppNotification) => {
    const isFriendReq = notif.type === 'friend_request';
    const isFollow = notif.type === 'follow';
    const displayName = notif.actorName || 'সম্মানিত নাগরিক';
    let displayMessage = cleanBengaliMessage(notif.message);
    if (displayName && displayMessage.startsWith(displayName)) {
      displayMessage = displayMessage.substring(displayName.length).trim();
    }

    // Determine clean real avatar or fallback to clean initial badge (NO cartoon dicebear)
    let effectiveAvatar = notif.actorAvatar && !notif.actorAvatar.includes('dicebear') ? notif.actorAvatar : '';
    if (!effectiveAvatar && notif.actorId && userPhotosMap[notif.actorId]) {
      effectiveAvatar = userPhotosMap[notif.actorId];
    }
    if (!effectiveAvatar && (displayName.includes('আমাদের পুঠিয়া') || notif.actorId === 'system')) {
      effectiveAvatar = '/logo.svg';
    }
    const hasFailed = failedAvatars.has(notif.id);

    return (
      <div 
        key={notif.id}
        onClick={() => handleNotificationClick(notif)}
        className={`px-4 py-3.5 flex items-start gap-3.5 relative transition-all duration-200 cursor-pointer select-none border-b border-slate-100/80 ${
          !notif.read 
            ? 'bg-emerald-50/60 hover:bg-emerald-100/50 border-l-4 border-l-[#0B7A3B]' 
            : 'bg-white hover:bg-slate-50/90'
        }`}
      >
        {/* Profile Avatar with Overlapping Badge */}
        <div className="relative shrink-0 pt-0.5">
          {effectiveAvatar && !hasFailed ? (
            <img 
              src={effectiveAvatar} 
              alt={displayName}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border border-slate-200/80 shadow-2xs"
              referrerPolicy="no-referrer"
              onError={() => setFailedAvatars(prev => new Set(prev).add(notif.id))}
            />
          ) : (
            <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-white text-base shadow-2xs border-2 border-white ${
              displayName.includes('আমাদের পুঠিয়া')
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                : 'bg-gradient-to-tr from-[#0B7A3B] to-[#059669]'
            }`}>
              {displayName.includes('আমাদের পুঠিয়া') ? (
                <img src="'/logo.svg'" alt="আমাদের পুঠিয়া" className="w-9 h-9 object-contain" />
              ) : (
                (displayName.charAt(0) || 'প').toUpperCase()
              )}
            </div>
          )}
          {getBadgeIcon(notif.type)}
        </div>

        {/* Content text */}
        <div className="flex-1 min-w-0 pr-1 pt-0.5">
          <p className="text-[14px] sm:text-[15px] text-slate-900 leading-[1.4]">
            <span className="font-bold text-slate-950 mr-1.5">{displayName}</span>
            <span className="text-slate-800 font-normal">{displayMessage}</span>
          </p>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] sm:text-[12.5px] text-slate-500 font-medium">
              {getBengaliTime(notif.createdAt)}
            </span>
            {!notif.read && (
              <span className="w-2 h-2 rounded-full bg-[#0B7A3B]" title="নতুন নোটিফিকেশন" />
            )}
          </div>

          {/* Interactive Friend Request buttons in Green Theme */}
          {isFriendReq && notif.actionStatus === 'pending' && (
            <div className="flex items-center gap-2 mt-2.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  respondToFriendRequest(notif.id, true);
                  toast.success("ফ্রেন্ড রিকোয়েস্ট গ্রহণ করা হয়েছে!");
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-[#0B7A3B] to-[#059669] hover:from-[#096330] hover:to-[#047857] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer border-none active:scale-95 flex items-center gap-1.5"
              >
                <Check size={13} strokeWidth={3} />
                <span>গ্রহণ করুন</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  respondToFriendRequest(notif.id, false);
                  toast.success("ফ্রেন্ড রিকোয়েস্ট বাতিল করা হয়েছে");
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border-none active:scale-95"
              >
                বাতিল করুন
              </button>
            </div>
          )}

          {isFollow && notif.actionStatus !== 'following' && (
            <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  toggleFollowBack(notif.id);
                  toast.success("ফলো ব্যাক করা হয়েছে!");
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0B7A3B] to-[#059669] hover:from-[#096330] hover:to-[#047857] text-white shadow-xs transition-all border-none cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <UserPlus size={13} strokeWidth={2.5} />
                <span>ফলো ব্যাক</span>
              </button>
            </div>
          )}
        </div>

        {/* Triple Dots Menu Button */}
        <div 
          className="shrink-0 self-center" 
          onClick={(e) => {
            e.stopPropagation();
            setSelectedMenuNotif(notif);
          }}
        >
          <button
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition cursor-pointer border-none bg-transparent"
            title="অপশন"
            aria-label="Options"
          >
            <MoreHorizontal size={19} className="stroke-[2.2]" />
          </button>
        </div>
      </div>
    );
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm select-none font-sans pb-12">
      {/* ========================================================================= */}
      {/* 1. STANDALONE TOP HEADER (Only shown when not wrapped in AddaFacebookHeader) */}
      {/* ========================================================================= */}
      {!hideHeader && (
        <header className="sticky top-0 z-40 bg-gradient-to-r from-[#0B7A3B] via-[#059669] to-[#10B981] text-white shadow-md">
          <div className="max-w-2xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleBack}
                className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition cursor-pointer border-none bg-transparent shrink-0"
                title="ফিরে যান"
                aria-label="Back"
              >
                <ChevronLeft size={26} className="stroke-[2.5]" />
              </button>
              
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                  নোটিফিকেশন
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-black bg-white text-[#0B7A3B] rounded-full shadow-xs">
                    {toBengaliNumber(unreadCount)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-white">
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition cursor-pointer border-none bg-transparent"
                title="সবগুলো পঠিত হিসেবে চিহ্নিত করুন"
                aria-label="Mark all as read"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <CheckCheck size={16} className="stroke-[2.5]" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsSearchActive(!isSearchActive)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition cursor-pointer border-none bg-transparent"
                title="নোটিফিকেশন খুঁজুন"
                aria-label="Search notifications"
              >
                <Search size={20} className="stroke-[2.3]" />
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition cursor-pointer border-none bg-transparent"
                title="নোটিফিকেশন সেটিংস"
                aria-label="Notification settings"
              >
                <SlidersHorizontal size={19} className="stroke-[2.3]" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-BAR WITH TITLE, ACTIONS & FILTER PILLS                             */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-100 px-3 sm:px-4 py-3">
        {/* Top row: Section Title & Quick Controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              নোটিফিকেশন
            </h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-black bg-emerald-50 text-[#0B7A3B] border border-emerald-200 rounded-full">
                {toBengaliNumber(unreadCount)} টি নতুন
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-700">
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-700 active:scale-95 transition cursor-pointer border-none bg-transparent"
              title="সবগুলো পঠিত চিহ্নিত করুন"
            >
              <CheckCheck size={18} className="stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setIsSearchActive(!isSearchActive)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-700 active:scale-95 transition cursor-pointer border-none bg-transparent"
              title="অনুসন্ধান"
            >
              <Search size={18} className="stroke-[2.3]" />
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-700 active:scale-95 transition cursor-pointer border-none bg-transparent"
              title="সেটিংস"
            >
              <SlidersHorizontal size={17} className="stroke-[2.3]" />
            </button>
          </div>
        </div>

        {/* Filter Pills matching Friends / Adda styling */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer border ${
              activeFilter === 'all'
                ? 'bg-[#0B7A3B] text-white border-[#0B7A3B] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            সকল ({toBengaliNumber(notifications.length)})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer border ${
              activeFilter === 'unread'
                ? 'bg-[#0B7A3B] text-white border-[#0B7A3B] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            অপঠিত ({toBengaliNumber(unreadCount)})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('security')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer border ${
              activeFilter === 'security'
                ? 'bg-[#0B7A3B] text-white border-[#0B7A3B] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            সিকিউরিটি ও সতর্কতা
          </button>
        </div>

        {/* Expandable Search Input */}
        <AnimatePresence>
          {isSearchActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="নোটিফিকেশন বা ব্যক্তির নাম লিখুন..."
                  className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0B7A3B] transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* 3. NOTIFICATIONS LIST: বাংলা সেকশন (নতুন ও পূর্ববর্তী)                      */}
      {/* ========================================================================= */}
      <main className="bg-white min-h-[50vh]">
        {filteredNotifications.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-16 h-16 bg-emerald-50 text-[#0B7A3B] rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Bell size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">কোনো নোটিফিকেশন নেই</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              আপনার অ্যাকাউন্টে নতুন কোনো ফ্রেন্ড রিকোয়েস্ট, লাইক, কমেন্ট বা সিস্টেম আপডেট আসলে তাৎক্ষণিক এখানে দেখতে পাবেন।
            </p>
          </div>
        ) : (
          <div>
            {/* 3.1 নতুন (New) Section */}
            {notificationSections.new.length > 0 && (
              <div>
                <div className="px-4 pt-3.5 pb-2 text-[14px] font-black text-[#0B7A3B] tracking-tight bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                  <span>নতুন ({toBengaliNumber(notificationSections.new.length)})</span>
                  <span className="text-xs text-slate-400 font-medium">অপঠিত</span>
                </div>
                <div>
                  {notificationSections.new.map(renderNotificationItem)}
                </div>
              </div>
            )}

            {/* 3.2 পূর্ববর্তী (Earlier) Section */}
            {notificationSections.earlier.length > 0 && (
              <div>
                <div className="px-4 pt-3.5 pb-2 text-[14px] font-black text-slate-700 tracking-tight bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                  <span>পূর্ববর্তী নোটিফিকেশন</span>
                  <span className="text-xs text-slate-400 font-medium">পঠিত</span>
                </div>
                <div>
                  {notificationSections.earlier.map(renderNotificationItem)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 4. ACTION BOTTOM SHEET MODAL (FOR THREE DOTS •••) IN FULL BENGALI        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedMenuNotif && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
            <div 
              className="absolute inset-0" 
              onClick={() => setSelectedMenuNotif(null)} 
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-4 z-10 pb-8 border-t border-slate-100"
            >
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4" />

              {/* Notification Header Preview */}
              <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-100">
                {(() => {
                  let modalAvatar = selectedMenuNotif.actorAvatar && !selectedMenuNotif.actorAvatar.includes('dicebear') ? selectedMenuNotif.actorAvatar : '';
                  if (!modalAvatar && selectedMenuNotif.actorId && userPhotosMap[selectedMenuNotif.actorId]) {
                    modalAvatar = userPhotosMap[selectedMenuNotif.actorId];
                  }
                  if (!modalAvatar && (selectedMenuNotif.actorName?.includes('আমাদের পুঠিয়া') || selectedMenuNotif.actorId === 'system')) {
                    modalAvatar = '/logo.svg';
                  }

                  return modalAvatar ? (
                    <img 
                      src={modalAvatar} 
                      alt={selectedMenuNotif.actorName} 
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#0B7A3B] to-[#059669] flex items-center justify-center text-white font-black text-sm border border-slate-200 shadow-2xs">
                      {(selectedMenuNotif.actorName?.charAt(0) || 'প').toUpperCase()}
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {selectedMenuNotif.actorName || 'সম্মানিত নাগরিক'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {(() => {
                      let cleanMsg = cleanBengaliMessage(selectedMenuNotif.message);
                      const aName = selectedMenuNotif.actorName || '';
                      if (aName && cleanMsg.startsWith(aName)) {
                        cleanMsg = cleanMsg.substring(aName.length).trim();
                      }
                      return cleanMsg;
                    })()}
                  </p>
                </div>
              </div>

              {/* Action Menu Items in Bengali */}
              <div className="space-y-1">
                {/* 1. Mark as read / unread */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMenuNotif.read) {
                      updatePreferences({});
                      toast.success("অপঠিত হিসেবে চিহ্নিত করা হয়েছে");
                    } else {
                      markAsRead(selectedMenuNotif.id);
                      toast.success("পঠিত হিসেবে চিহ্নিত করা হয়েছে");
                    }
                    setSelectedMenuNotif(null);
                  }}
                  className="w-full px-3 py-3 rounded-2xl flex items-center gap-3.5 hover:bg-slate-100 transition text-slate-800 text-sm font-semibold cursor-pointer border-none bg-transparent"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-[#0B7A3B]">
                    {selectedMenuNotif.read ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                  <span>{selectedMenuNotif.read ? "অপঠিত হিসেবে চিহ্নিত করুন" : "পঠিত হিসেবে চিহ্নিত করুন"}</span>
                </button>

                {/* 2. Remove this notification */}
                <button
                  type="button"
                  onClick={() => {
                    deleteNotification(selectedMenuNotif.id);
                    toast.success("নোটিফিকেশনটি মুছে ফেলা হয়েছে");
                    setSelectedMenuNotif(null);
                  }}
                  className="w-full px-3 py-3 rounded-2xl flex items-center gap-3.5 hover:bg-rose-50 text-rose-600 transition text-sm font-semibold cursor-pointer border-none bg-transparent"
                >
                  <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                    <Trash2 size={18} />
                  </div>
                  <span>এই নোটিফিকেশনটি মুছে ফেলুন</span>
                </button>

                {/* 3. Turn off notifications of this type */}
                <button
                  type="button"
                  onClick={() => {
                    toast.success("এই ধরনের নোটিফিকেশন বন্ধ করা হয়েছে");
                    setSelectedMenuNotif(null);
                  }}
                  className="w-full px-3 py-3 rounded-2xl flex items-center gap-3.5 hover:bg-slate-100 transition text-slate-800 text-sm font-semibold cursor-pointer border-none bg-transparent"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                    <BellOff size={18} />
                  </div>
                  <span>এই ধরনের নোটিফিকেশন বন্ধ করুন</span>
                </button>

                {/* 4. Report issue */}
                <button
                  type="button"
                  onClick={() => {
                    toast.success("রিপোর্ট জমা নেওয়া হয়েছে");
                    setSelectedMenuNotif(null);
                  }}
                  className="w-full px-3 py-3 rounded-2xl flex items-center gap-3.5 hover:bg-slate-100 transition text-slate-800 text-sm font-semibold cursor-pointer border-none bg-transparent"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <ShieldAlert size={18} />
                  </div>
                  <span>রিপোর্ট করুন</span>
                </button>
              </div>

              {/* Close Button */}
              <div className="mt-4 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMenuNotif(null)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-sm transition cursor-pointer border-none"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. SETTINGS PREFERENCES MODAL IN FULL BENGALI                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl border border-slate-100"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-[#0B7A3B]" />
                  <span className="font-bold text-slate-900 text-sm">নোটিফিকেশন সেটিংস</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl border-none bg-transparent cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">রিঅ্যাকশন ও লাইক</h4>
                    <p className="text-[11px] text-slate-500">পোস্টে লাইক বা রিঅ্যাক্ট আসলে নোটিফিকেশন পাবেন</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={preferences.reactions}
                    onChange={(e) => updatePreferences({ reactions: e.target.checked })}
                    className="w-4.5 h-4.5 accent-[#0B7A3B] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">মন্তব্য ও উত্তর</h4>
                    <p className="text-[11px] text-slate-500">পোস্টে কেউ কমেন্ট বা রিপ্লাই দিলে নোটিফিকেশন পাবেন</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={preferences.comments}
                    onChange={(e) => updatePreferences({ comments: e.target.checked })}
                    className="w-4.5 h-4.5 accent-[#0B7A3B] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">বন্ধুর অনুরোধ (Friend Requests)</h4>
                    <p className="text-[11px] text-slate-500">নতুন ফ্রেন্ড রিকোয়েস্ট আসলে নোটিফিকেশন পাবেন</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={preferences.friendRequests}
                    onChange={(e) => updatePreferences({ friendRequests: e.target.checked })}
                    className="w-4.5 h-4.5 accent-[#0B7A3B] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">বিরক্ত করবেন না (DND Mode)</h4>
                    <p className="text-[11px] text-slate-500">সকল নোটিফিকেশন সাউন্ড ও পপআপ বন্ধ থাকবে</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={preferences.dndEnabled}
                    onChange={(e) => updatePreferences({ dndEnabled: e.target.checked })}
                    className="w-4.5 h-4.5 accent-[#0B7A3B] cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3.5 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    toast.success("নোটিফিকেশন পছন্দসমূহ সংরক্ষিত হয়েছে");
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-[#0B7A3B] to-[#059669] hover:from-[#096330] hover:to-[#047857] text-white text-xs font-bold rounded-xl cursor-pointer border-none shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. NOTIFICATION DETAIL MODAL FOR SYSTEM & GENERAL ALERTS                   */}
      {/* ========================================================================= */}
      {viewDetailNotif && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative text-slate-800">
            <button
              type="button"
              onClick={() => setViewDetailNotif(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition border-0 bg-transparent cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3.5 mb-3">
              <img
                src={viewDetailNotif.actorAvatar || '/logo.svg'}
                alt={viewDetailNotif.actorName || 'System'}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-base leading-tight">
                  {viewDetailNotif.actorName || 'সিস্টেম নোটিফিকেশন'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {getBengaliTime(viewDetailNotif.createdAt)}
                </p>
              </div>
            </div>

            {viewDetailNotif.title && (
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">
                {viewDetailNotif.title}
              </h4>
            )}

            <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 font-medium leading-relaxed my-3">
              {cleanBengaliMessage(viewDetailNotif.message) || 'নোটিফিকেশনের কোনো অতিরিক্ত বিবরণ নেই।'}
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const targetUid = viewDetailNotif.actorId || viewDetailNotif.actionData?.senderId || viewDetailNotif.targetId;
                  setViewDetailNotif(null);
                  if (targetUid && targetUid !== 'system_broadcast') {
                    navigate(`/profile/${targetUid}`);
                  } else {
                    navigate('/settings');
                  }
                }}
                className="w-full py-2.5 bg-gradient-to-r from-[#0B7A3B] to-[#059669] hover:from-[#096330] hover:to-[#047857] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-xs border-0 cursor-pointer"
              >
                বিস্তারিত দেখুন / পেজে যান
              </button>

              <button
                type="button"
                onClick={() => setViewDetailNotif(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition border-0 cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
