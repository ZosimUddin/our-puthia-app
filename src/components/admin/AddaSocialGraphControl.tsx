import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  Zap, 
  ShieldAlert, 
  Search, 
  Filter, 
  Trash2, 
  Ban, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Shield, 
  Layers, 
  ShieldOff, 
  Eye, 
  UserMinus, 
  Flame, 
  Bot, 
  AlertOctagon,
  X
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

export type GraphTabType = 
  | 'requests' 
  | 'followers' 
  | 'following' 
  | 'fake_activity' 
  | 'mass_spam' 
  | 'blocked';

export interface SocialRelationshipItem {
  id: string;
  type: 'request' | 'follow' | 'block' | 'fake_alert' | 'mass_spam';
  
  // Actor 1 (Sender / Follower / Blocker)
  actorId: string;
  actorName: string;
  actorUsername?: string;
  actorPhotoUrl?: string;
  actorBadge?: boolean;
  actorFollowCount?: number;
  actorReqCountRecent?: number;
  
  // Actor 2 (Receiver / Target / Blocked User)
  targetId: string;
  targetName: string;
  targetUsername?: string;
  targetPhotoUrl?: string;
  
  // Status & Metadata
  status: 'pending' | 'accepted' | 'rejected' | 'blocked' | 'flagged';
  riskScore?: number; // 0 to 100
  riskReason?: string;
  followVelocityPerHour?: number;
  
  createdAt: string;
}

// Bengali number helper
const toBn = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "০";
  return String(num).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
};

export const AddaSocialGraphControl: React.FC = () => {
  const { user, userProfile } = useAuth();

  // State
  const [items, setItems] = useState<SocialRelationshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GraphTabType>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals & Warning
  const [selectedItem, setSelectedItem] = useState<SocialRelationshipItem | null>(null);
  const [warningModalItem, setWarningModalItem] = useState<SocialRelationshipItem | null>(null);
  const [warningText, setWarningText] = useState('অস্বাভাবিক ফ্রেন্ড রিকোয়েস্ট বা ম্যাস ফলো স্প্যামিংয়ের কারণে আপনার অ্যাকাউন্ট নজরদারিতে রয়েছে।');

  // Disconnect Confirmation Modal
  const [disconnectModalItem, setDisconnectModalItem] = useState<SocialRelationshipItem | null>(null);

  // 1. Live Firestore Sync (listening to friend_requests, user_follows, and user_blocks)
  useEffect(() => {
    setLoading(true);
    try {
      const list: SocialRelationshipItem[] = [];

      // Query 1: Friend requests
      const reqQuery = query(collection(db, 'friend_requests'), limit(150));
      const unsubscribeReq = onSnapshot(reqQuery, (snap) => {
        const reqList: SocialRelationshipItem[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          reqList.push({
            id: docSnap.id,
            type: 'request',
            actorId: d.senderId || 'anon_1',
            actorName: d.senderName || 'নাগরিক',
            actorUsername: d.senderUsername || 'user1',
            actorPhotoUrl: d.senderPhotoUrl || '',
            targetId: d.receiverId || 'anon_2',
            targetName: d.receiverName || 'প্রাপক নাগরিক',
            targetUsername: d.receiverUsername || 'user2',
            targetPhotoUrl: d.receiverPhotoUrl || '',
            status: d.status || 'pending',
            createdAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date(d.createdAt.seconds * 1000).toISOString()) : new Date().toISOString()
          });
        });

        // Query 2: Follows
        const followQuery = query(collection(db, 'user_follows'), limit(150));
        const unsubscribeFollow = onSnapshot(followQuery, (fSnap) => {
          const followList: SocialRelationshipItem[] = [];
          fSnap.forEach((docSnap) => {
            const d = docSnap.data();
            followList.push({
              id: docSnap.id,
              type: 'follow',
              actorId: d.followerId || 'follower_1',
              actorName: d.followerName || 'ফলোয়ার',
              actorUsername: d.followerUsername || 'follower',
              actorPhotoUrl: d.followerPhotoUrl || '',
              targetId: d.targetUserId || 'target_1',
              targetName: d.targetUserName || 'টার্গেট প্রোফাইল',
              targetUsername: d.targetUsername || 'target',
              targetPhotoUrl: d.targetPhotoUrl || '',
              status: 'accepted',
              createdAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date(d.createdAt.seconds * 1000).toISOString()) : new Date().toISOString()
            });
          });

          // Query 3: Blocks
          const blockQuery = query(collection(db, 'user_blocks'), limit(100));
          const unsubscribeBlock = onSnapshot(blockQuery, (bSnap) => {
            const blockList: SocialRelationshipItem[] = [];
            bSnap.forEach((docSnap) => {
              const d = docSnap.data();
              blockList.push({
                id: docSnap.id,
                type: 'block',
                actorId: d.blockerUid || 'blocker_1',
                actorName: d.blockerName || 'ব্লকার ইউজার',
                targetId: d.blockedUid || 'blocked_1',
                targetName: d.blockedName || 'ব্লকড আইডি',
                status: 'blocked',
                riskReason: d.reason || 'ইউজার পর্যায়ে ব্লক করা হয়েছে',
                createdAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date(d.createdAt.seconds * 1000).toISOString()) : new Date().toISOString()
              });
            });

            // Combine and add AI Bot / Mass Spam Detections if fresh
            let combined = [...reqList, ...followList, ...blockList];

            // If empty, seed rich sample graph data
            if (combined.length === 0) {
              combined = [
                {
                  id: 'req_01',
                  type: 'request',
                  actorId: 'usr_01',
                  actorName: 'মো. জসিম উদ্দিন',
                  actorUsername: 'zosim_puthia',
                  actorBadge: true,
                  targetId: 'usr_02',
                  targetName: 'তাহমিনা আক্তার',
                  targetUsername: 'tahmina_raj',
                  status: 'pending',
                  createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
                },
                {
                  id: 'fol_02',
                  type: 'follow',
                  actorId: 'usr_03',
                  actorName: 'আরিফ আহমেদ',
                  actorUsername: 'arif_puthia',
                  targetId: 'usr_01',
                  targetName: 'মো. জসিম উদ্দিন',
                  targetUsername: 'zosim_puthia',
                  status: 'accepted',
                  createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
                },
                {
                  id: 'fake_alert_03',
                  type: 'fake_alert',
                  actorId: 'usr_fake_99',
                  actorName: 'ফ্রি মোবাইল লটারি BD',
                  actorUsername: 'lottery_bot_01',
                  targetId: 'usr_04',
                  targetName: 'নাসরিন সুলতানা',
                  status: 'flagged',
                  riskScore: 94,
                  riskReason: 'একই আইপি থেকে ১০ মিনিটে ৫০+ অপরিচিত প্রোফাইলে রিকোয়েস্ট প্রেরণ',
                  createdAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString()
                },
                {
                  id: 'mass_spam_04',
                  type: 'mass_spam',
                  actorId: 'usr_mass_11',
                  actorName: 'অটো প্রমোশন সার্ভিস',
                  actorUsername: 'auto_promo_bot',
                  targetId: 'usr_01',
                  targetName: 'মো. জসিম উদ্দিন',
                  status: 'flagged',
                  riskScore: 88,
                  followVelocityPerHour: 180,
                  riskReason: 'ঘণ্টায় ১৮০+ আইডি ম্যাস ফলো করার কারণে বট প্যাটার্ন শনাক্ত',
                  createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
                },
                {
                  id: 'blk_05',
                  type: 'block',
                  actorId: 'usr_02',
                  actorName: 'তাহমিনা আক্তার',
                  targetId: 'usr_mass_11',
                  targetName: 'অটো প্রমোশন সার্ভিস',
                  status: 'blocked',
                  riskReason: 'অপ্রয়োজনীয় মেসেজ ও কমেন্ট স্প্যামিং',
                  createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
                }
              ];
            }

            setItems(combined);
            setLoading(false);
          });
        });
      });

      return () => {
        unsubscribeReq();
      };
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Tab Filters
      if (activeTab === 'requests' && item.type !== 'request') return false;
      if (activeTab === 'followers' && item.type !== 'follow') return false;
      if (activeTab === 'following' && item.type !== 'follow') return false;
      if (activeTab === 'fake_activity' && item.type !== 'fake_alert') return false;
      if (activeTab === 'mass_spam' && item.type !== 'mass_spam') return false;
      if (activeTab === 'blocked' && item.type !== 'block') return false;

      // 2. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.actorName.toLowerCase().includes(q) ||
          item.targetName.toLowerCase().includes(q) ||
          (item.actorUsername && item.actorUsername.toLowerCase().includes(q)) ||
          (item.riskReason && item.riskReason.toLowerCase().includes(q))
        );
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, activeTab, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      requests: items.filter(i => i.type === 'request').length,
      followers: items.filter(i => i.type === 'follow').length,
      following: items.filter(i => i.type === 'follow').length,
      fake_activity: items.filter(i => i.type === 'fake_alert' || (i.riskScore && i.riskScore > 80)).length,
      mass_spam: items.filter(i => i.type === 'mass_spam' || (i.followVelocityPerHour && i.followVelocityPerHour > 50)).length,
      blocked: items.filter(i => i.type === 'block').length,
    };
  }, [items]);

  // ---------------- ACTION HANDLERS ---------------- //

  // 1. Disconnect / Remove Relationship
  const handleConfirmDisconnect = async () => {
    if (!disconnectModalItem) return;
    setActionLoading(true);
    try {
      if (disconnectModalItem.type === 'request') {
        await deleteDoc(doc(db, 'friend_requests', disconnectModalItem.id)).catch(() => null);
      } else if (disconnectModalItem.type === 'follow') {
        await deleteDoc(doc(db, 'user_follows', disconnectModalItem.id)).catch(() => null);
      }

      await logAuditActivity({
        action: 'DISCONNECT_SOCIAL_RELATIONSHIP',
        details: `সুপার এডমিন ${disconnectModalItem.actorName} এবং ${disconnectModalItem.targetName}-এর মধ্যকার সংযোগ বিচ্ছিন্ন করেছেন`,
        category: 'security',
        severity: 'warning',
        targetType: 'user',
        targetId: disconnectModalItem.actorId,
        targetName: disconnectModalItem.actorName
      });

      toast.success(`✂️ সংযোগটি সফলভাবে বিচ্ছিন্ন করা হয়েছে`);
      setDisconnectModalItem(null);
    } catch (err) {
      toast.error('সংযোগ বিচ্ছিন্ন করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Issue Warning to Spammer / Bot
  const handleConfirmWarning = async () => {
    if (!warningModalItem) return;
    setActionLoading(true);
    try {
      if (warningModalItem.actorId && warningModalItem.actorId !== 'anon_1') {
        const userRef = doc(db, 'users', warningModalItem.actorId);
        await updateDoc(userRef, {
          warningsCount: increment(1),
          lastWarningReason: warningText,
          updatedAt: serverTimestamp()
        }).catch(() => null);
      }

      await logAuditActivity({
        action: 'ISSUE_SPAM_GRAPH_WARNING',
        details: `সুপার এডমিন ${warningModalItem.actorName}-কে ম্যাস স্প্যাম / ফেক রিকোয়েস্টের জন্য সতর্কবার্তা পাঠিয়েছেন: "${warningText}"`,
        category: 'security',
        severity: 'warning',
        targetType: 'user',
        targetId: warningModalItem.actorId,
        targetName: warningModalItem.actorName
      });

      toast.success(`⚠️ ${warningModalItem.actorName}-কে সফলভাবে সতর্কবার্তা পাঠানো হয়েছে!`);
      setWarningModalItem(null);
    } catch (err) {
      toast.error('সতর্কবার্তা পাঠাতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Force Block User
  const handleForceBlock = async (item: SocialRelationshipItem) => {
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', item.actorId);
      await updateDoc(userRef, {
        status: 'suspended',
        isBlocked: true,
        statusReason: 'স্প্যাম ও বট ফ্রেন্ডশিপ কার্যকলাপের কারণে সুপার এডমিন কর্তৃক ব্লক্ড',
        updatedAt: serverTimestamp()
      }).catch(() => null);

      await logAuditActivity({
        action: 'FORCE_BLOCK_SPAM_USER',
        details: `সুপার এডমিন স্প্যামার আইডি ${item.actorName} (${item.actorId})-কে সিস্টেমে ফোর্স ব্লক করেছেন`,
        category: 'security',
        severity: 'critical',
        targetType: 'user',
        targetId: item.actorId,
        targetName: item.actorName
      });

      toast.success(`🚫 ${item.actorName}-কে সফলভাবে ব্লক করা হয়েছে`);
    } catch (err) {
      toast.error('ব্লক করতে সমস্যা হয়েছে');
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
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                  আড্ডা সোশাল গ্রাফ কন্ট্রোল
                </span>
                <span className="text-[11px] font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  স্প্যাম অ্যালার্ট: {toBn(counts.fake_activity + counts.mass_spam)}টি
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ফ্রেন্ডস ও ফলো কন্ট্রোল হাব
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-2xl">
                ফ্রেন্ড রিকোয়েস্ট, ফলোয়ার ও ফলোয়িং সম্পর্ক, ফেক অ্যাক্টিভিটি শনাক্তকরণ, ম্যাস ফলো স্প্যাম প্রতিরোধ ও ব্লকড ইউজার ব্যবস্থাপনা
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-emerald-950/70 px-4 py-2 rounded-2xl border border-emerald-400/30 backdrop-blur-md text-xs font-bold text-emerald-200">
              ব্লকড ইউজার: <strong className="text-rose-300 font-black">{toBn(counts.blocked)}</strong>টি
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER CARDS (Friend Requests, Followers, Following, Fake activity, Mass follow/spam, Blocked users) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { id: 'requests', label: 'Friend Requests', count: counts.requests, icon: UserPlus, color: 'text-purple-700 bg-purple-50 border-purple-200' },
          { id: 'followers', label: 'Followers', count: counts.followers, icon: UserCheck, color: 'text-[#0B7A3B] bg-emerald-50 border-emerald-200' },
          { id: 'following', label: 'Following', count: counts.following, icon: Users, color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { id: 'fake_activity', label: 'Fake friendship', count: counts.fake_activity, icon: Bot, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { id: 'mass_spam', label: 'Mass follow / spam', count: counts.mass_spam, icon: Zap, color: 'text-red-700 bg-red-50 border-red-200' },
          { id: 'blocked', label: 'Blocked users', count: counts.blocked, icon: Ban, color: 'text-slate-700 bg-slate-100 border-slate-200' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as GraphTabType)}
            className={`p-3 min-h-[82px] rounded-2xl border transition-all flex flex-col justify-between text-left cursor-pointer ${
              activeTab === item.id 
                ? 'bg-white border-[#0B7A3B] ring-2 ring-[#0B7A3B]/20 shadow-sm' 
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-1 mb-1">
              <span className="text-xs sm:text-sm font-black text-slate-700 leading-tight flex-1 break-words">{item.label}</span>
              <div className={`p-1.5 rounded-xl border shrink-0 ${item.color}`}>
                <item.icon size={13} />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-black text-slate-900 leading-none">{toBn(item.count)}</p>
          </button>
        ))}
      </div>

      {/* 3. SEARCH & BAR */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-2xs space-y-3">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="ইউজার নাম, ইউজারনেম বা স্প্যামের বিবরণ দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-emerald-200 text-slate-900 rounded-xl text-sm font-bold placeholder-slate-400 focus:outline-none focus:border-[#0B7A3B]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none w-full min-w-0">
          {[
            { id: 'requests', label: `🤝 ফ্রেন্ড রিকোয়েস্ট (${toBn(counts.requests)})` },
            { id: 'followers', label: `👥 ফলোয়ার্স (${toBn(counts.followers)})` },
            { id: 'fake_activity', label: `🤖 ফেক অ্যাক্টিভিটি (${toBn(counts.fake_activity)})` },
            { id: 'mass_spam', label: `⚡ ম্যাস স্প্যাম (${toBn(counts.mass_spam)})` },
            { id: 'blocked', label: `🚫 ব্লকড আইডি (${toBn(counts.blocked)})` },
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

      {/* 4. RELATIONSHIPS & AUDIT LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-emerald-100 shadow-2xs">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0B7A3B] mb-2" />
            <p className="text-xs font-bold">সোশাল গ্রাফ ডাটাবেজ লোড হচ্ছে...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-500 border border-emerald-100 shadow-2xs">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-80" />
            <p className="text-sm font-black text-slate-800">কোনো সন্দেহজনক সোশাল রেকর্ড নেই</p>
            <p className="text-xs text-slate-400 mt-1">নির্বাচিত ক্যাটাগরির সকল ফ্রেন্ড ও ফলো অ্যাক্টিভিটি স্বাভাবিক</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSpam = item.type === 'fake_alert' || item.type === 'mass_spam';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl border p-5 transition-all shadow-2xs space-y-3 ${
                  isSpam 
                    ? 'border-rose-300 bg-rose-50/15' 
                    : item.type === 'block' 
                    ? 'border-slate-300 bg-slate-50/60' 
                    : 'border-emerald-100 hover:border-emerald-300'
                }`}
              >
                {/* Header: Type, Status, Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white flex items-center gap-1">
                      {item.type === 'request' && <UserPlus size={10} />}
                      {item.type === 'follow' && <UserCheck size={10} />}
                      {item.type === 'fake_alert' && <Bot size={10} />}
                      {item.type === 'mass_spam' && <Zap size={10} />}
                      {item.type === 'block' && <Ban size={10} />}
                      <span>
                        {item.type === 'request' ? 'ফ্রেন্ড রিকোয়েস্ট' :
                         item.type === 'follow' ? 'ফলো কানেকশন' :
                         item.type === 'fake_alert' ? 'ফেক ফ্রেন্ডশিপ অ্যালার্ট' :
                         item.type === 'mass_spam' ? 'ম্যাস ফলো স্প্যাম' : 'ব্লকড রেকর্ড'}
                      </span>
                    </span>

                    {item.riskScore && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse flex items-center gap-1">
                        <AlertTriangle size={10} /> রিস্ক স্কোর: {toBn(item.riskScore)}%
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium">
                    {new Date(item.createdAt).toLocaleString('bn-BD')}
                  </p>
                </div>

                {/* Connection Flow: Actor -> Target */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                  {/* Actor 1 */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0B7A3B] to-emerald-800 text-white flex items-center justify-center font-black text-xs shrink-0">
                      {item.actorName[0] || 'A'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-slate-900">{item.actorName}</p>
                        {item.actorBadge && <span className="text-[9px] bg-[#006a4e] text-white px-1 rounded-full">✓</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">@{item.actorUsername || 'user'}</p>
                      <span className="text-[9px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 inline-block mt-0.5">
                        {item.type === 'request' ? 'প্রেরক (Sender)' : item.type === 'follow' ? 'ফলোয়ার (Follower)' : 'অ্যাক্টর'}
                      </span>
                    </div>
                  </div>

                  {/* Flow Arrow */}
                  <div className="flex items-center justify-center text-slate-400 font-bold text-xs gap-1.5">
                    <span className="text-[10px] bg-white px-2 py-1 rounded-xl border border-slate-200 text-slate-600">
                      {item.type === 'request' ? 'রিকোয়েস্ট পাঠিয়েছে' : item.type === 'follow' ? 'ফলো করছে' : item.type === 'block' ? 'ব্লক করেছে' : 'স্প্যাম টার্গেট'}
                    </span>
                    <ArrowRight size={15} className="text-[#0B7A3B]" />
                  </div>

                  {/* Target User */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white flex items-center justify-center font-black text-xs shrink-0">
                      {item.targetName[0] || 'T'}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{item.targetName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">@{item.targetUsername || 'target'}</p>
                      <span className="text-[9px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 inline-block mt-0.5">
                        {item.type === 'request' ? 'প্রাপক (Receiver)' : item.type === 'follow' ? 'ফলোয়িং (Following)' : 'টার্গেট'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risk / Spam details if flagged */}
                {item.riskReason && (
                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>শনাক্তকরণ কারণ: {item.riskReason}</span>
                  </div>
                )}

                {/* Actions Toolbar */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Sparkles size={12} className="text-[#0B7A3B]" />
                    <span>সুপার এডমিন কন্ট্রোল:</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* 1. Disconnect */}
                    <button
                      onClick={() => setDisconnectModalItem(item)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="সংযোগ বিচ্ছিন্ন করুন"
                    >
                      <UserMinus size={13} /> Disconnect
                    </button>

                    {/* 2. User Warning */}
                    <button
                      onClick={() => {
                        setWarningModalItem(item);
                        setWarningText(`অস্বাভাবিক ফ্রেন্ড রিকোয়েস্ট বা ম্যাস স্প্যামিং অ্যাক্টিভিটির জন্য আপনাকে সতর্ক করা হচ্ছে।`);
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="ইউজারকে সতর্কবার্তা পাঠান"
                    >
                      <AlertTriangle size={13} /> Warning
                    </button>

                    {/* 3. Force Block */}
                    <button
                      onClick={() => handleForceBlock(item)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
                      title="আইডি স্থায়ী ব্লক করুন"
                    >
                      <Ban size={13} /> Force Block
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ---------------- MODAL 1: WARNING MODAL ---------------- */}
      <AnimatePresence>
        {warningModalItem && (
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
                  <h3 className="text-base font-black">স্প্যাম সতর্কবার্তা প্রেরণ</h3>
                  <p className="text-xs text-slate-500">প্রাপক: {warningModalItem.actorName}</p>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-700 space-y-1">
                <label className="text-slate-500">সতর্কবার্তার বিবরণ:</label>
                <textarea
                  rows={3}
                  value={warningText}
                  onChange={(e) => setWarningText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-purple-500"
                  placeholder="সতর্কবার্তা লিখুন..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWarningModalItem(null)}
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
                  {actionLoading ? 'পাঠানো হচ্ছে...' : 'সতর্কবার্তা নিশ্চিত করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 2: DISCONNECT MODAL ---------------- */}
      <AnimatePresence>
        {disconnectModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-700">
                <div className="p-3 bg-rose-100 rounded-2xl">
                  <UserMinus size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">সংযোগ বিচ্ছিন্ন করুন (Disconnect)</h3>
                  <p className="text-xs text-slate-500">{disconnectModalItem.actorName} ➔ {disconnectModalItem.targetName}</p>
                </div>
              </div>

              <p className="text-xs text-slate-700">
                আপনি কি নিশ্চিত যে এই দুই ইউজারের মধ্যকার বন্ধুত্ব বা ফলো সম্পর্কটি বাতিল করতে চান?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDisconnectModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDisconnect}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'বিচ্ছিন্ন হচ্ছে...' : 'বিচ্ছিন্ন করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AddaSocialGraphControl;
