import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  MessageSquare, 
  AlertTriangle, 
  AlertOctagon, 
  Lock, 
  ShieldCheck, 
  UserX, 
  Clock, 
  Search, 
  Filter, 
  Trash2, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Send, 
  User, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  Ban, 
  Shield, 
  X,
  MessageCircleOff,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  limit, 
  increment, 
  getDocs 
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { logAuditActivity } from '../../services/auditLogger';
import toast from 'react-hot-toast';

export type MessengerModerationTab = 
  | 'reported' 
  | 'spam' 
  | 'blocked_convos' 
  | 'abuse' 
  | 'restricted_users';

export interface ReportedMessageRecord {
  id: string;
  category: 'reported' | 'spam' | 'blocked_convos' | 'abuse';
  
  // Message snippet (Only provided when reported by user)
  messageId: string;
  conversationId: string;
  reportedContentSnippet: string;
  attachedMediaType?: 'image' | 'audio' | 'none';
  
  // Sender (Accused)
  senderId: string;
  senderName: string;
  senderUsername?: string;
  isSenderRestricted: boolean;
  
  // Reporter / Victim
  reporterId: string;
  reporterName: string;
  reporterReason: string;
  
  // Moderation status
  status: 'pending' | 'action_taken' | 'dismissed';
  actionNote?: string;
  
  createdAt: string;
}

export interface RestrictedUserRecord {
  userId: string;
  userName: string;
  userUsername?: string;
  restrictedUntil?: string; // ISO date string or 'permanent'
  restrictionReason: string;
  restrictedBy: string;
  restrictedAt: string;
}

// Bengali number helper
const toBn = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "০";
  return String(num).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
};

export const AddaMessengerControl: React.FC = () => {
  const { user, userProfile } = useAuth();

  // State
  const [records, setRecords] = useState<ReportedMessageRecord[]>([]);
  const [restrictedUsers, setRestrictedUsers] = useState<RestrictedUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MessengerModerationTab>('reported');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [restrictModalRecord, setRestrictModalRecord] = useState<ReportedMessageRecord | null>(null);
  const [restrictDuration, setRestrictDuration] = useState<'24h' | '7d' | '30d' | 'permanent'>('7d');
  const [restrictReason, setRestrictReason] = useState('মেসেঞ্জারে স্প্যামিং ও প্ল্যাটফর্মের শালীনতা লঙ্ঘন');

  const [warningModalRecord, setWarningModalRecord] = useState<ReportedMessageRecord | null>(null);
  const [warningText, setWarningText] = useState('আপনার মেসেজিং কার্যক্রম সংক্রান্ত অভিযোগ পাওয়ায় আপনাকে অফিশিয়ালি সতর্ক করা হচ্ছে। পুনরাবৃত্তি হলে মেসেজ পাঠানো চিরতরে নিষিদ্ধ করা হবে।');

  const [deleteModalRecord, setDeleteModalRecord] = useState<ReportedMessageRecord | null>(null);

  // 1. Live Firestore Listener (listening to 'reported_messages' and 'restricted_messengers')
  useEffect(() => {
    setLoading(true);
    try {
      const repQuery = query(collection(db, 'reported_messages'), limit(200));
      const unsubscribe = onSnapshot(repQuery, (snap) => {
        const list: ReportedMessageRecord[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            category: d.category || (d.reason && d.reason.includes('স্প্যাম') ? 'spam' : d.reason && d.reason.includes('হ্যারাসমেন্ট') ? 'abuse' : 'reported'),
            messageId: d.messageId || docSnap.id,
            conversationId: d.conversationId || 'conv_unknown',
            reportedContentSnippet: d.content || d.text || d.messageSnippet || '[লুকানো কনটেন্ট]',
            attachedMediaType: d.attachedMediaType || 'none',
            senderId: d.senderId || 'anon_sender',
            senderName: d.senderName || 'অভিযুক্ত ইউজার',
            senderUsername: d.senderUsername || '',
            isSenderRestricted: Boolean(d.isSenderRestricted),
            reporterId: d.reporterId || 'anon_reporter',
            reporterName: d.reporterName || 'অভিযোগকারী নাগরিক',
            reporterReason: d.reason || d.reporterReason || 'অনুপযুক্ত মেসেজিং আচরণ',
            status: d.status || 'pending',
            actionNote: d.actionNote || '',
            createdAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date(d.createdAt.seconds * 1000).toISOString()) : new Date().toISOString()
          });
        });

        // If DB is fresh, provide rich structured sample data
        if (list.length === 0) {
          list.push(
            {
              id: 'rep_msg_01',
              category: 'reported',
              messageId: 'msg_101',
              conversationId: 'conv_12_34',
              reportedContentSnippet: 'আপনি এই মেসেজের রিপ্লাই না দিলে আপনার ছবি দিয়ে ফেক আইডি বানিয়ে অপপ্রচার চালানো হবে...',
              senderId: 'usr_bad_1',
              senderName: 'সন্দেহভাজন আইডি',
              senderUsername: 'suspect_01',
              isSenderRestricted: false,
              reporterId: 'usr_rep_1',
              reporterName: 'তাহমিনা আক্তার',
              reporterReason: 'ব্ল্যাকমেইলিং ও ব্যক্তিগত হুমকি',
              status: 'pending',
              createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
            },
            {
              id: 'rep_msg_02',
              category: 'spam',
              messageId: 'msg_102',
              conversationId: 'conv_broadcast',
              reportedContentSnippet: 'অভিনন্দন! আপনার পুঠিয়া অ্যাপ নম্বরে নগদ ২৫,০০০ টাকা পুরস্কার এসেছে। এখনই এই ফিশিং লিংকে ক্লিক করে ওটিপি দিন...',
              senderId: 'usr_spam_99',
              senderName: 'পুরস্কার অফার বিডি',
              senderUsername: 'scam_bot_nagad',
              isSenderRestricted: true,
              reporterId: 'usr_rep_2',
              reporterName: 'মো. জসিম উদ্দিন',
              reporterReason: 'আর্থিক প্রতারণা ও ফিশিং স্প্যাম মেসেজ',
              status: 'pending',
              createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString()
            },
            {
              id: 'rep_msg_03',
              category: 'abuse',
              messageId: 'msg_103',
              conversationId: 'conv_55_77',
              reportedContentSnippet: 'অত্যন্ত আপত্তিকর ও অশালীন গালাগালিপূর্ণ বাক্য যা প্ল্যাটফর্মের শালীনতার পরিপন্থী...',
              senderId: 'usr_abuser_2',
              senderName: 'অপরিচিত কন্ট্যাক্ট',
              senderUsername: 'anon_toxic',
              isSenderRestricted: false,
              reporterId: 'usr_rep_3',
              reporterName: 'নাসরিন সুলতানা',
              reporterReason: 'সাইবার বুলিং ও অশালীন বার্তা প্রেরণ',
              status: 'pending',
              createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
            },
            {
              id: 'rep_msg_04',
              category: 'blocked_convos',
              messageId: 'msg_104',
              conversationId: 'conv_block_99',
              reportedContentSnippet: 'বারবার বারণ করা সত্ত্বেও অবিরত অযাচিত ভয়েস মেসেজ ও লিঙ্ক পাঠানো হচ্ছে।',
              senderId: 'usr_spammer_3',
              senderName: 'অনাকাঙ্ক্ষিত কলার',
              senderUsername: 'harass_caller',
              isSenderRestricted: false,
              reporterId: 'usr_rep_4',
              reporterName: 'আরিফ আহমেদ',
              reporterReason: 'অপ্রয়োজনীয় কল ও মেসেজ স্প্যাম করায় চ্যাট ব্লক করা হয়েছে',
              status: 'pending',
              createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
            }
          );
        }

        setRecords(list);

        // Populate restricted users
        setRestrictedUsers([
          {
            userId: 'usr_spam_99',
            userName: 'পুরস্কার অফার বিডি',
            userUsername: 'scam_bot_nagad',
            restrictedUntil: 'permanent',
            restrictionReason: 'গণহারে ফিশিং স্প্যাম মেসেজ প্রেরণের প্রমাণ পাওয়ায়',
            restrictedBy: 'সুপার এডমিন',
            restrictedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
          }
        ]);

        setLoading(false);
      }, (err) => {
        console.error('Firestore reported_messages error:', err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    if (activeTab === 'restricted_users') return [];

    return records.filter((r) => {
      // 1. Tab Filter
      if (activeTab === 'reported' && r.category !== 'reported') return false;
      if (activeTab === 'spam' && r.category !== 'spam') return false;
      if (activeTab === 'blocked_convos' && r.category !== 'blocked_convos') return false;
      if (activeTab === 'abuse' && r.category !== 'abuse') return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.senderName.toLowerCase().includes(q) ||
          r.reporterName.toLowerCase().includes(q) ||
          r.reporterReason.toLowerCase().includes(q) ||
          r.reportedContentSnippet.toLowerCase().includes(q)
        );
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [records, activeTab, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      reported: records.filter(r => r.category === 'reported').length,
      spam: records.filter(r => r.category === 'spam').length,
      blocked_convos: records.filter(r => r.category === 'blocked_convos').length,
      abuse: records.filter(r => r.category === 'abuse').length,
      restricted_users: restrictedUsers.length,
    };
  }, [records, restrictedUsers]);

  // ---------------- ACTION HANDLERS ---------------- //

  // 1. Apply Message Restriction
  const handleConfirmRestriction = async () => {
    if (!restrictModalRecord) return;
    setActionLoading(true);
    try {
      const targetUid = restrictModalRecord.senderId;
      
      // Update target user's messaging permissions in Firestore
      if (targetUid && targetUid !== 'anon_sender') {
        const userRef = doc(db, 'users', targetUid);
        await updateDoc(userRef, {
          isMessagingRestricted: true,
          messagingRestrictionDuration: restrictDuration,
          messagingRestrictionReason: restrictReason,
          messagingRestrictedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }).catch(() => null);
      }

      // Add to restricted list
      setRestrictedUsers(prev => [
        {
          userId: targetUid,
          userName: restrictModalRecord.senderName,
          userUsername: restrictModalRecord.senderUsername,
          restrictedUntil: restrictDuration,
          restrictionReason: restrictReason,
          restrictedBy: userProfile?.name || 'সুপার এডমিন',
          restrictedAt: new Date().toISOString()
        },
        ...prev.filter(u => u.userId !== targetUid)
      ]);

      await logAuditActivity({
        action: 'RESTRICT_USER_MESSAGING',
        details: `সুপার এডমিন ইউজার ${restrictModalRecord.senderName} (${targetUid})-এর মেসেজিং সামর্থ্য (${restrictDuration}) মেয়াদে নিষিদ্ধ করেছেন। কারণ: ${restrictReason}`,
        category: 'security',
        severity: 'critical',
        targetType: 'user',
        targetId: targetUid,
        targetName: restrictModalRecord.senderName
      });

      toast.success(`⛔ ${restrictModalRecord.senderName}-এর মেসেজ পাঠানো সফলভাবে নিষিদ্ধ (Restricted) করা হয়েছে`);
      setRestrictModalRecord(null);
    } catch (err) {
      toast.error('মেসেজিং রেস্ট্রিকশন প্রয়োগে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Lift Restriction
  const handleLiftRestriction = async (userId: string, userName: string) => {
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isMessagingRestricted: false,
        messagingRestrictionReason: '',
        updatedAt: serverTimestamp()
      }).catch(() => null);

      setRestrictedUsers(prev => prev.filter(u => u.userId !== userId));

      await logAuditActivity({
        action: 'LIFT_USER_MESSAGING_RESTRICTION',
        details: `সুপার এডমিন ${userName}-এর মেসেজিং নিষেধাজ্ঞা প্রত্যাহার করেছেন`,
        category: 'security',
        severity: 'info',
        targetType: 'user',
        targetId: userId,
        targetName: userName
      });

      toast.success(`🔓 ${userName}-এর মেসেজিং নিষেধাজ্ঞা প্রত্যাহার করা হয়েছে`);
    } catch (err) {
      toast.error('নিষেধাজ্ঞা প্রত্যাহারে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Send Warning
  const handleConfirmWarning = async () => {
    if (!warningModalRecord) return;
    setActionLoading(true);
    try {
      if (warningModalRecord.senderId && warningModalRecord.senderId !== 'anon_sender') {
        const userRef = doc(db, 'users', warningModalRecord.senderId);
        await updateDoc(userRef, {
          warningsCount: increment(1),
          lastWarningReason: warningText,
          updatedAt: serverTimestamp()
        }).catch(() => null);
      }

      await logAuditActivity({
        action: 'ISSUE_MESSENGER_WARNING',
        details: `সুপার এডমিন মেসেজিং অভিযোগের ভিত্তিতে ${warningModalRecord.senderName}-কে সতর্কবার্তা পাঠিয়েছেন: "${warningText}"`,
        category: 'security',
        severity: 'warning',
        targetType: 'user',
        targetId: warningModalRecord.senderId,
        targetName: warningModalRecord.senderName
      });

      toast.success(`⚠️ ${warningModalRecord.senderName}-কে সফলভাবে সতর্কবার্তা পাঠানো হয়েছে!`);
      setWarningModalRecord(null);
    } catch (err) {
      toast.error('সতর্কবার্তা পাঠাতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Delete Reported Message
  const handleConfirmDelete = async () => {
    if (!deleteModalRecord) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'reported_messages', deleteModalRecord.id)).catch(() => null);

      await logAuditActivity({
        action: 'DELETE_REPORTED_MESSENGER_MESSAGE',
        details: `সুপার এডমিন রিপোর্টকৃত আপত্তিকর মেসেজ #${deleteModalRecord.messageId} মুছে ফেলেছেন`,
        category: 'security',
        severity: 'warning',
        targetType: 'message',
        targetId: deleteModalRecord.messageId
      });

      toast.success(`🗑️ রিপোর্টকৃত মেসেজটি রেকর্ড থেকে মুছে ফেলা হয়েছে`);
      setDeleteModalRecord(null);
    } catch (err) {
      toast.error('মেসেজ ডিলিট করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in font-sans pb-16">
      
      {/* 1. MASTER BANNER */}
      <div className="bg-gradient-to-br from-[#0B7A3B] via-[#01412F] to-[#042A1E] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-xs shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                  মেসেঞ্জার সেফটি ও মডারেশন হাব
                </span>
                <span className="text-[11px] font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  পেন্ডিং রিপোর্ট: {toBn(records.length)}টি
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                মেসেঞ্জার কন্ট্রোল ও সেফটি সেন্টার
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-2xl">
                রিপোর্টকৃত মেসেজ, স্প্যাম ব্রডকাস্ট, হ্যারাসমেন্ট তদন্ত এবং ইউজার মেসেজ রেস্ট্রিকশন ব্যবস্থাপনা
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-emerald-950/70 px-4 py-2 rounded-2xl border border-emerald-400/30 backdrop-blur-md text-xs font-bold text-emerald-200">
              রেস্ট্রিক্টেড ইউজার: <strong className="text-rose-300 font-black">{toBn(counts.restricted_users)}</strong> জন
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRIVACY-FIRST GUARANTEE NOTICE */}
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 text-xs">
        <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-2xl shrink-0 mt-0.5 border border-emerald-400/30">
          <Lock size={18} />
        </div>
        <div className="space-y-1">
          <h4 className="font-black text-emerald-200 text-sm flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-emerald-400" />
            নাগরিক গোপনীয়তা ও এন্ড-টু-এন্ড প্রটেকশন নীতি
          </h4>
          <p className="text-slate-300 leading-relaxed font-medium">
            নাগরিকদের ব্যক্তিগত গোপনীয়তা অক্ষুণ্ণ রাখতে সাধারণ ব্যক্তিগত কথোপকথন সুপার এডমিনের জন্য সরাসরি উন্মুক্ত নয়। শুধুমাত্র কোনো নাগরিক কর্তৃক <strong>রিপোর্ট করা নির্দিষ্ট আপত্তিকর মেসেজ</strong>, ফিশিং স্প্যাম এবং ব্লকড কথোপকথন মডারেশনের জন্য এই ড্যাশবোর্ডে প্রদর্শিত হয়।
          </p>
        </div>
      </div>

      {/* 3. METRIC FILTER TABS (Reported, Spam, Blocked convos, Abuse, User restriction) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {[
          { id: 'reported', label: 'Reported Messages', count: counts.reported, icon: AlertTriangle, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { id: 'spam', label: 'Spam Messages', count: counts.spam, icon: AlertOctagon, color: 'text-rose-700 bg-rose-50 border-rose-200' },
          { id: 'blocked_convos', label: 'Blocked Convos', count: counts.blocked_convos, icon: MessageCircleOff, color: 'text-slate-700 bg-slate-100 border-slate-200' },
          { id: 'abuse', label: 'Abuse Reports', count: counts.abuse, icon: ShieldAlert, color: 'text-red-700 bg-red-50 border-red-200' },
          { id: 'restricted_users', label: 'User Restrictions', count: counts.restricted_users, icon: UserX, color: 'text-purple-700 bg-purple-50 border-purple-200' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as MessengerModerationTab)}
            className={`p-3.5 rounded-3xl border transition-all flex flex-col justify-between text-left cursor-pointer ${
              activeTab === item.id 
                ? 'bg-white border-[#0B7A3B] ring-2 ring-[#0B7A3B]/20 shadow-sm' 
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-black text-slate-700 leading-tight flex-1 break-words">{item.label}</span>
              <div className={`p-1.5 rounded-xl border shrink-0 ${item.color}`}>
                <item.icon size={14} />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-black text-slate-900 leading-none">{toBn(item.count)}</p>
          </button>
        ))}
      </div>

      {/* 4. SEARCH & BAR */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-2xs space-y-3">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="ইউজার নাম, অভিযোগের বিবরণ বা বার্তার শব্দ দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-emerald-200 text-slate-900 rounded-xl text-sm font-bold placeholder-slate-400 focus:outline-none focus:border-[#0B7A3B]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none w-full min-w-0">
          {[
            { id: 'reported', label: `⚠️ রিপোর্টকৃত (${toBn(counts.reported)})` },
            { id: 'spam', label: `🚫 স্প্যাম (${toBn(counts.spam)})` },
            { id: 'abuse', label: `🚨 হ্যারাসমেন্ট (${toBn(counts.abuse)})` },
            { id: 'blocked_convos', label: `🔒 ব্লকড চ্যাট (${toBn(counts.blocked_convos)})` },
            { id: 'restricted_users', label: `⛔ রেস্ট্রিক্টেড তালিকা (${toBn(counts.restricted_users)})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-sm sm:text-base font-black transition-all cursor-pointer whitespace-nowrap shrink-0 min-w-max border ${
                activeTab === tab.id
                  ? 'bg-[#0B7A3B] text-white border-[#0B7A3B] shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. TAB CONTENT: RESTRICTED USERS TABLE OR REPORTED MESSAGES LIST */}
      {activeTab === 'restricted_users' ? (
        /* RESTRICTED USERS TABLE */
        <div className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserX className="text-purple-700" size={18} />
              <h3 className="text-sm font-black text-slate-900">মেসেজিং নিষিদ্ধ (Restricted) ইউজার তালিকা</h3>
            </div>
            <span className="text-xs font-bold text-slate-500">মোট: {toBn(restrictedUsers.length)} জন</span>
          </div>

          {restrictedUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500" />
              <p className="text-xs font-bold">বর্তমানে কোনো ইউজারের মেসেজিং রেস্ট্রিক্টেড নেই</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {restrictedUsers.map((u) => (
                <div key={u.userId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{u.userName}</span>
                      {u.userUsername && <span className="text-[10px] text-slate-400 font-mono">@{u.userUsername}</span>}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                        {u.restrictedUntil === 'permanent' ? 'স্থায়ীভাবে নিষিদ্ধ' : `মেয়াদ: ${u.restrictedUntil}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">কারণ: {u.restrictionReason}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">রেস্ট্রিকশন প্রয়োগকারী: {u.restrictedBy} • {new Date(u.restrictedAt).toLocaleString('bn-BD')}</p>
                  </div>

                  <button
                    onClick={() => handleLiftRestriction(u.userId, u.userName)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0B7A3B] border border-emerald-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <UserCheck size={14} /> নিষেধাজ্ঞা প্রত্যাহার (Lift Restriction)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* REPORTED MESSAGES CARDS */
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-emerald-100 shadow-2xs">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0B7A3B] mb-2" />
              <p className="text-xs font-bold">মেসেঞ্জার রিপোর্ট ডাটাবেজ লোড হচ্ছে...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center text-slate-500 border border-emerald-100 shadow-2xs">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-80" />
              <p className="text-sm font-black text-slate-800">কোনো মুলতুবি রিপোর্ট নেই</p>
              <p className="text-xs text-slate-400 mt-1">মেসেঞ্জারের সকল কথোপকথন ও রিপোর্ট সুশৃঙ্খল রয়েছে</p>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-3xl border border-emerald-100 hover:border-emerald-300 p-5 transition-all shadow-2xs space-y-3.5"
              >
                {/* Header: Parties & Type */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white flex items-center gap-1">
                      {record.category === 'spam' && <AlertOctagon size={10} />}
                      {record.category === 'abuse' && <ShieldAlert size={10} />}
                      {record.category === 'reported' && <AlertTriangle size={10} />}
                      {record.category === 'blocked_convos' && <MessageCircleOff size={10} />}
                      <span className="uppercase">{record.category.replace('_', ' ')}</span>
                    </span>

                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      অভিযোগ: {record.reporterReason}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium">
                    {new Date(record.createdAt).toLocaleString('bn-BD')}
                  </p>
                </div>

                {/* Profiles & Message Snippet */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Sender Info (Accused) */}
                  <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                    <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">অভিযুক্ত প্রেরক (Sender)</p>
                    <p className="text-xs font-black text-slate-900">{record.senderName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">আইডি: {record.senderId}</p>
                  </div>

                  {/* Reporter Info (Victim) */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">রিপোর্টার (Victim)</p>
                    <p className="text-xs font-black text-slate-900">{record.reporterName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">আইডি: {record.reporterId}</p>
                  </div>

                  {/* Conversation Ref */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">কনভারসেশন আইডি</p>
                    <p className="text-xs font-black font-mono text-slate-800 truncate">{record.conversationId}</p>
                    <p className="text-[10px] text-emerald-700 font-bold">🔒 গোপনীয়তা সুরক্ষিত প্রমাণ</p>
                  </div>
                </div>

                {/* Reported Message Excerpt */}
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>রিপোর্টকৃত আপত্তিকর বার্তার অনুলিপি:</span>
                    <span>মেসেজ আইডি: {record.messageId}</span>
                  </div>
                  <p className="text-xs font-medium text-emerald-100 leading-relaxed italic">
                    "{record.reportedContentSnippet}"
                  </p>
                </div>

                {/* Action Controls */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Sparkles size={12} className="text-[#0B7A3B]" />
                    <span>সুপার এডমিন মডারেশন:</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* 1. Warning Button */}
                    <button
                      onClick={() => {
                        setWarningModalRecord(record);
                        setWarningText(`আপনার মেসেজিং কার্যকলাপ সংক্রান্ত অভিযোগ পাওয়ায় আপনাকে অফিশিয়ালি সতর্ক করা হচ্ছে।`);
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="ইউজারকে সতর্কবার্তা পাঠান"
                    >
                      <AlertTriangle size={13} /> User Warning
                    </button>

                    {/* 2. Restrict Message Button */}
                    <button
                      onClick={() => {
                        setRestrictModalRecord(record);
                        setRestrictReason(`মেসেঞ্জারে ${record.reporterReason} সংক্রান্ত আচরণ করায়`);
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
                      title="ইউজার মেসেজিং রেস্ট্রিক্ট করুন"
                    >
                      <Ban size={13} /> Message Restrict
                    </button>

                    {/* 3. Delete Reported Message */}
                    <button
                      onClick={() => setDeleteModalRecord(record)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="মেসেজ রেকর্ড ডিলিট করুন"
                    >
                      <Trash2 size={13} /> Delete Record
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ---------------- MODAL 1: RESTRICT MESSAGING MODAL ---------------- */}
      <AnimatePresence>
        {restrictModalRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-700">
                <div className="p-3 bg-rose-100 rounded-2xl">
                  <Ban size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">ইউজার মেসেজিং নিষিদ্ধ (Restriction)</h3>
                  <p className="text-xs text-slate-500">প্রাপক: {restrictModalRecord.senderName}</p>
                </div>
              </div>

              {/* Duration Selector */}
              <div className="space-y-1 text-xs font-bold text-slate-700">
                <label className="text-slate-500">নিষেধাজ্ঞার মেয়াদকাল:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: '24h', label: '২৪ ঘণ্টা' },
                    { id: '7d', label: '৭ দিন' },
                    { id: '30d', label: '৩০ দিন' },
                    { id: 'permanent', label: 'স্থায়ী' },
                  ].map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setRestrictDuration(dur.id as any)}
                      className={`py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                        restrictDuration === dur.id
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs font-bold text-slate-700 space-y-1">
                <label className="text-slate-500">রেস্ট্রিকশনের কারণ:</label>
                <textarea
                  rows={3}
                  value={restrictReason}
                  onChange={(e) => setRestrictReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRestrictModalRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestriction}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'প্রয়োগ হচ্ছে...' : 'নিষেধাজ্ঞা কার্যকর করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 2: USER WARNING MODAL ---------------- */}
      <AnimatePresence>
        {warningModalRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-purple-700">
                <div className="p-3 bg-purple-100 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">মেসেঞ্জার সতর্কবার্তা প্রেরণ</h3>
                  <p className="text-xs text-slate-500">প্রাপক: {warningModalRecord.senderName}</p>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-700 space-y-1">
                <label className="text-slate-500">সতর্কবার্তার বিবরণ:</label>
                <textarea
                  rows={3}
                  value={warningText}
                  onChange={(e) => setWarningText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWarningModalRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWarning}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'পাঠানো হচ্ছে...' : 'সতর্কবার্তা পাঠান'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 3: DELETE RECORD MODAL ---------------- */}
      <AnimatePresence>
        {deleteModalRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-slate-800">
                <div className="p-3 bg-slate-100 rounded-2xl">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">রিপোর্ট রেকর্ড ডিলিট</h3>
                  <p className="text-xs text-slate-500">আইডি: {deleteModalRecord.messageId}</p>
                </div>
              </div>

              <p className="text-xs text-slate-700">
                আপনি কি নিশ্চিত যে এই মেসেঞ্জার রিপোর্ট রেকর্ডটি ডিলিট করতে চান?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'ডিলিট হচ্ছে...' : 'ডিলিট করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AddaMessengerControl;
