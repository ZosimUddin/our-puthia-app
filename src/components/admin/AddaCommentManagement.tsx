import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  AlertTriangle, 
  AlertOctagon, 
  Trash2, 
  RotateCcw, 
  Search, 
  Filter, 
  Heart, 
  Eye, 
  EyeOff, 
  User, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  ShieldAlert, 
  Send,
  Check,
  X,
  Layers,
  ArrowRight,
  Shield
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
  increment 
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { logAuditActivity } from '../../services/auditLogger';
import toast from 'react-hot-toast';

export type CommentFilterType = 'all' | 'reported' | 'spam' | 'hidden';

export interface AdminManagedComment {
  id: string;
  postId: string;
  postTitle?: string;
  postSnippet?: string;
  
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorPhotoUrl?: string;
  authorBadge?: boolean;
  
  content: string;
  likesCount: number;
  reportsCount: number;
  isSpam: boolean;
  isHidden: boolean;
  hideReason?: string;
  
  parentCommentId?: string; // If reply
  
  createdAt: string;
  updatedAt?: string;
}

// Bengali number helper
const toBn = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "০";
  return String(num).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
};

export const AddaCommentManagement: React.FC = () => {
  const { user, userProfile } = useAuth();

  // State
  const [comments, setComments] = useState<AdminManagedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<CommentFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [warningModalComment, setWarningModalComment] = useState<AdminManagedComment | null>(null);
  const [warningText, setWarningText] = useState('আপনার মন্তব্যটি প্ল্যাটফর্মের শালীনতা ও নীতিমালার পরিপন্থী হওয়ায় আপনাকে সতর্ক করা হচ্ছে।');

  const [deleteModalComment, setDeleteModalComment] = useState<AdminManagedComment | null>(null);

  // 1. Live Firestore Listener
  useEffect(() => {
    setLoading(true);
    try {
      const commentsQuery = query(collection(db, 'comments'), limit(300));
      const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        const list: AdminManagedComment[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();

          const text = d.content || d.text || '';
          const isSpamDetected = Boolean(
            d.isSpam || 
            (d.reportsCount && d.reportsCount >= 3) ||
            text.includes('http') && (text.includes('free') || text.includes('lottery') || text.includes('ইনকাম'))
          );

          list.push({
            id: docSnap.id,
            postId: d.postId || 'unknown_post',
            postTitle: d.postTitle || d.postSnippet || 'আড্ডা পোস্ট',
            postSnippet: d.postSnippet || '',
            
            authorId: d.authorId || d.userId || d.uid || 'anon_user',
            authorName: d.authorName || d.userName || 'নাগরিক',
            authorUsername: d.authorUsername || d.username || '',
            authorPhotoUrl: d.authorPhotoUrl || d.userPhotoUrl || '',
            authorBadge: Boolean(d.authorBadge || d.isVerified),
            
            content: text,
            likesCount: d.likesCount || d.likeCount || 0,
            reportsCount: d.reportsCount || d.reportCount || 0,
            isSpam: isSpamDetected,
            isHidden: Boolean(d.isHidden || d.hidden),
            hideReason: d.hideReason || '',
            parentCommentId: d.parentCommentId || d.parentId || undefined,
            
            createdAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date(d.createdAt.seconds * 1000).toISOString()) : new Date().toISOString(),
            updatedAt: d.updatedAt ? (typeof d.updatedAt === 'string' ? d.updatedAt : new Date(d.updatedAt.seconds * 1000).toISOString()) : undefined
          });
        });

        // Seed rich sample data if DB is initially clean
        if (list.length === 0) {
          list.push(
            {
              id: 'com_seed_01',
              postId: 'post_seed_01',
              postTitle: 'পুঠিয়া রাজবাড়ি চত্বর পরিচ্ছন্নতা কর্মসূচি',
              authorId: 'usr_com_1',
              authorName: 'তানভীর আহমেদ',
              authorUsername: 'tanvir_raj',
              authorBadge: true,
              content: 'অসাধারণ উদ্যোগ! পুঠিয়ার সকল সচেতন নাগরিকের উচিত এতে এগিয়ে আসা। ধন্যবাদ সবাইকে।',
              likesCount: 18,
              reportsCount: 0,
              isSpam: false,
              isHidden: false,
              createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
            },
            {
              id: 'com_seed_02',
              postId: 'post_seed_02',
              postTitle: 'পুঠিয়া বাজার নির্ধারিত দ্রব্যমূল্য তালিকা',
              authorId: 'usr_com_2',
              authorName: 'রফিক সরকার',
              authorUsername: 'rafiq_s',
              authorBadge: false,
              content: 'এই সেবাগুলো সম্পূর্ণ ভুয়া এবং প্রশাসন শুধু টাকা খাওয়ার জন্য এগুলো করছে। কোনো কাজই হয় না।',
              likesCount: 2,
              reportsCount: 5,
              isSpam: false,
              isHidden: false,
              createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString()
            },
            {
              id: 'com_seed_03',
              postId: 'post_seed_01',
              postTitle: 'পুঠিয়া রাজবাড়ি চত্বর পরিচ্ছন্নতা কর্মসূচি',
              authorId: 'usr_com_3',
              authorName: 'টেলিগ্রাম ইনকাম বট',
              authorUsername: 'free_income_bot',
              authorBadge: false,
              content: 'প্রতিদিন ঘরে বসে ৫০০-১০০০ টাকা ইনকাম করতে এখনই টেলিগ্রাম চ্যানেলে জয়েন করুন 👉 http://free-crypto-scam.xyz',
              likesCount: 0,
              reportsCount: 9,
              isSpam: true,
              isHidden: true,
              hideReason: 'বট ও ফিশিং স্প্যাম কমেন্ট',
              createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString()
            },
            {
              id: 'com_seed_04',
              postId: 'post_seed_03',
              postTitle: 'পুঠিয়া শিব মন্দিরের সান্ধ্যকালীন দৃশ্য',
              authorId: 'usr_com_4',
              authorName: 'সালমা খাতুন',
              authorUsername: 'salma_k',
              authorBadge: false,
              content: 'ছবিটি খুবই সুন্দর এসেছে। কোন ক্যামেরা দিয়ে তোলা হয়েছে?',
              likesCount: 8,
              reportsCount: 0,
              isSpam: false,
              isHidden: false,
              createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
            }
          );
        }

        setComments(list);
        setLoading(false);
      }, (err) => {
        console.error('Firestore comments onSnapshot error:', err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  // Filtered comments
  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      // 1. Filter Tab
      if (activeFilter === 'reported' && c.reportsCount < 1) return false;
      if (activeFilter === 'spam' && !c.isSpam) return false;
      if (activeFilter === 'hidden' && !c.isHidden) return false;

      // 2. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          c.content.toLowerCase().includes(q) ||
          c.authorName.toLowerCase().includes(q) ||
          (c.authorUsername && c.authorUsername.toLowerCase().includes(q)) ||
          (c.postTitle && c.postTitle.toLowerCase().includes(q)) ||
          c.id.toLowerCase().includes(q)
        );
      }

      return true;
    }).sort((a, b) => {
      if (activeFilter === 'reported') return b.reportsCount - a.reportsCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [comments, activeFilter, searchQuery]);

  // Metric counts
  const counts = useMemo(() => {
    return {
      all: comments.length,
      reported: comments.filter(c => c.reportsCount > 0).length,
      spam: comments.filter(c => c.isSpam).length,
      hidden: comments.filter(c => c.isHidden).length,
    };
  }, [comments]);

  // ---------------- ACTION HANDLERS ---------------- //

  // 1. Delete Comment
  const handleConfirmDelete = async () => {
    if (!deleteModalComment) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'comments', deleteModalComment.id));

      await logAuditActivity({
        action: 'DELETE_ADDA_COMMENT',
        details: `সুপার এডমিন কমেন্ট #${deleteModalComment.id} (${deleteModalComment.authorName}) ডাটাবেজ থেকে মুছে ফেলেছেন`,
        category: 'security',
        severity: 'warning',
        targetType: 'comment',
        targetId: deleteModalComment.id,
        targetName: deleteModalComment.authorName
      });

      toast.success(`🗑️ মন্তব্যটি সফলভাবে ডিলিট করা হয়েছে`);
      setDeleteModalComment(null);
    } catch (err) {
      toast.error('মন্তব্য ডিলিট করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Restore Comment
  const handleRestoreComment = async (commentItem: AdminManagedComment) => {
    setActionLoading(true);
    try {
      const commentRef = doc(db, 'comments', commentItem.id);
      await updateDoc(commentRef, {
        isHidden: false,
        hideReason: '',
        isSpam: false,
        moderatedBy: userProfile?.name || 'সুপার এডমিন',
        restoredAt: serverTimestamp()
      });

      await logAuditActivity({
        action: 'RESTORE_ADDA_COMMENT',
        details: `সুপার এডমিন পূর্বে লুকানো কমেন্ট #${commentItem.id} (${commentItem.authorName}) পুনরায় সচল করেছেন`,
        category: 'security',
        severity: 'info',
        targetType: 'comment',
        targetId: commentItem.id,
        targetName: commentItem.authorName
      });

      toast.success(`♻️ মন্তব্যটি সফলভাবে পুনরুদ্ধার (Restore) করে সচল করা হয়েছে!`);
    } catch (err) {
      toast.error('মন্তব্য রিস্টোর করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. User Warning
  const handleConfirmWarning = async () => {
    if (!warningModalComment) return;
    setActionLoading(true);
    try {
      // Update target user's warning status
      if (warningModalComment.authorId && warningModalComment.authorId !== 'anon_user') {
        const userRef = doc(db, 'users', warningModalComment.authorId);
        await updateDoc(userRef, {
          warningsCount: increment(1),
          lastWarningReason: warningText,
          updatedAt: serverTimestamp()
        });
      }

      await logAuditActivity({
        action: 'ISSUE_COMMENT_USER_WARNING',
        details: `সুপার এডমিন কমেন্টকারী ${warningModalComment.authorName}-কে সতর্কবার্তা পাঠিয়েছেন: "${warningText}"`,
        category: 'security',
        severity: 'warning',
        targetType: 'user',
        targetId: warningModalComment.authorId,
        targetName: warningModalComment.authorName
      });

      toast.success(`⚠️ ${warningModalComment.authorName}-কে সফলভাবে সতর্কবার্তা পাঠানো হয়েছে!`);
      setWarningModalComment(null);
    } catch (err) {
      toast.error('সতর্কবার্তা পাঠাতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Toggle Hide Comment
  const handleToggleHide = async (commentItem: AdminManagedComment) => {
    const nextHidden = !commentItem.isHidden;
    setActionLoading(true);
    try {
      const commentRef = doc(db, 'comments', commentItem.id);
      await updateDoc(commentRef, {
        isHidden: nextHidden,
        hideReason: nextHidden ? 'মডারেটর কর্তৃক লুকানো' : '',
        updatedAt: serverTimestamp()
      });

      await logAuditActivity({
        action: nextHidden ? 'HIDE_ADDA_COMMENT' : 'UNHIDE_ADDA_COMMENT',
        details: `সুপার এডমিন কমেন্ট #${commentItem.id}-কে ${nextHidden ? 'লুকিয়েছেন (Hide)' : 'দৃশ্যমান করেছেন'}`,
        category: 'security',
        severity: 'info',
        targetType: 'comment',
        targetId: commentItem.id
      });

      toast.success(nextHidden ? `👁️‍🗨️ মন্তব্যটি লুকানো হয়েছে` : `মন্তব্যটি দৃশ্যমান করা হয়েছে`);
    } catch (err) {
      toast.error('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
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
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-xs shrink-0">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                  কমেন্ট মডারেশন কমান্ড সেন্টার
                </span>
                <span className="text-[11px] font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  মোট মন্তব্য: {toBn(counts.all)}টি
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                আড্ডা কমেন্ট ও মন্তব্য ম্যানেজমেন্ট
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-2xl">
                সকল নাগরিক মন্তব্য, রিপোর্টকৃত কমেন্ট, স্প্যাম ফিল্টারিং, ডিলিট, রিস্টোর ও ইউজার ওয়ার্নিং কমান্ড সেন্টার
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-emerald-950/70 px-4 py-2 rounded-2xl border border-emerald-400/30 backdrop-blur-md text-xs font-bold text-emerald-200">
              ফ্ল্যাগড কমেন্ট: <strong className="text-amber-300 font-black">{toBn(counts.reported)}</strong>টি
            </div>
          </div>
        </div>
      </div>

      {/* 2. METRIC FILTER CARDS (সব Comments, Reported Comments, Spam Comments, Hidden) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'all', label: 'সব Comments', count: counts.all, icon: MessageSquare, color: 'text-[#0B7A3B] bg-emerald-50 border-emerald-200' },
          { id: 'reported', label: 'Reported Comments', count: counts.reported, icon: AlertTriangle, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { id: 'spam', label: 'Spam Comments', count: counts.spam, icon: AlertOctagon, color: 'text-rose-700 bg-rose-50 border-rose-200' },
          { id: 'hidden', label: 'Hidden / Moderated', count: counts.hidden, icon: EyeOff, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveFilter(item.id as CommentFilterType)}
            className={`p-4 rounded-3xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              activeFilter === item.id 
                ? 'bg-white border-[#0B7A3B] ring-2 ring-[#0B7A3B]/20 shadow-sm' 
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-700">{item.label}</span>
              <div className={`p-2 rounded-2xl border ${item.color}`}>
                <item.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{toBn(item.count)}</p>
          </button>
        ))}
      </div>

      {/* 3. SEARCH & BAR */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-2xs space-y-3">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="মন্তব্যের বিবরণ, মন্তব্যকারী বা পোস্টের শিরোনাম দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-emerald-200 text-slate-900 rounded-xl text-xs font-bold placeholder-slate-400 focus:outline-none focus:border-[#0B7A3B]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none w-full min-w-0">
          {[
            { id: 'all', label: `সব মন্তব্য (${toBn(counts.all)})` },
            { id: 'reported', label: `⚠️ রিপোর্টকৃত (${toBn(counts.reported)})` },
            { id: 'spam', label: `🚫 স্প্যাম (${toBn(counts.spam)})` },
            { id: 'hidden', label: `👁️‍🗨️ লুকানো (${toBn(counts.hidden)})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-sm sm:text-base font-black transition-all cursor-pointer whitespace-nowrap shrink-0 min-w-max border ${
                activeFilter === tab.id
                  ? 'bg-[#0B7A3B] text-white border-[#0B7A3B] shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. COMMENTS LIST & ACTION CARDS */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-emerald-100 shadow-2xs">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0B7A3B] mb-2" />
            <p className="text-xs font-bold">কমেন্ট ডাটাবেজ লোড হচ্ছে...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-500 border border-emerald-100 shadow-2xs">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-80" />
            <p className="text-sm font-black text-slate-800">কোনো মন্তব্য পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-1">নির্বাচিত ফিল্টারে সকল মন্তব্য পরিচ্ছন্ন ও নিরাপদ রয়েছে</p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`bg-white rounded-3xl border p-5 transition-all shadow-2xs space-y-3 ${
                comment.isSpam 
                  ? 'border-rose-300 bg-rose-50/15' 
                  : comment.reportsCount > 0 
                  ? 'border-amber-200 bg-amber-50/10' 
                  : 'border-emerald-100 hover:border-emerald-300'
              }`}
            >
              {/* Comment Header: Author & Post Context */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {comment.authorPhotoUrl ? (
                      <img src={comment.authorPhotoUrl} alt="" className="w-9 h-9 rounded-xl object-cover border border-emerald-200" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B7A3B] to-blue-700 text-white flex items-center justify-center font-black text-xs">
                        {comment.authorName[0] || 'U'}
                      </div>
                    )}
                    {comment.authorBadge && (
                      <span className="absolute -bottom-1 -right-1 p-0.5 bg-[#006a4e] text-white rounded-full text-[8px] font-bold">✓</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-slate-900 text-xs">{comment.authorName}</span>
                      {comment.authorUsername && (
                        <span className="text-[11px] text-slate-400 font-mono">@{comment.authorUsername}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      পোস্ট: <strong className="text-slate-600 font-bold">{comment.postTitle || comment.postId}</strong> • {new Date(comment.createdAt).toLocaleString('bn-BD')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Spam Badge */}
                  {comment.isSpam && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white flex items-center gap-1">
                      <AlertOctagon size={10} /> স্প্যাম কমেন্ট
                    </span>
                  )}

                  {/* Reports Badge */}
                  {comment.reportsCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1">
                      <AlertTriangle size={10} /> {toBn(comment.reportsCount)}টি ফ্ল্যাগড
                    </span>
                  )}

                  {/* Hidden Badge */}
                  {comment.isHidden ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700 flex items-center gap-1">
                      <EyeOff size={10} /> লুকানো (Hidden)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      সক্রিয়
                    </span>
                  )}
                </div>
              </div>

              {/* Comment Content */}
              <div className="space-y-1.5">
                <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                  "{comment.content}"
                </p>

                {comment.hideReason && (
                  <p className="text-[11px] text-rose-700 font-bold">
                    লুকানোর কারণ: {comment.hideReason}
                  </p>
                )}
              </div>

              {/* Comment Actions Toolbar (Delete, Restore, User Warning, Hide/Unhide) */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-slate-400 font-bold">
                  <span className="flex items-center gap-1 text-rose-600">
                    <Heart size={12} /> {toBn(comment.likesCount)} লাইক
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* 1. User Warning Button */}
                  <button
                    onClick={() => {
                      setWarningModalComment(comment);
                      setWarningText(`আপনার মন্তব্যটি (${comment.content.slice(0, 30)}...) প্ল্যাটফর্ম নীতিমালার পরিপন্থী হওয়ায় আপনাকে সতর্ক করা হলো।`);
                    }}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                    title="ইউজারকে সতর্কবার্তা পাঠান"
                  >
                    <AlertTriangle size={13} /> User warning
                  </button>

                  {/* 2. Hide / Restore Button */}
                  {comment.isHidden ? (
                    <button
                      onClick={() => handleRestoreComment(comment)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-[#006a4e] hover:bg-[#00523b] text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
                      title="মন্তব্য পুনরুদ্ধার করুন"
                    >
                      <RotateCcw size={13} /> Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleHide(comment)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="মন্তব্য লুকান"
                    >
                      <EyeOff size={13} /> Hide
                    </button>
                  )}

                  {/* 3. Delete Button */}
                  <button
                    onClick={() => setDeleteModalComment(comment)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                    title="মন্তব্য ডিলিট করুন"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ---------------- MODAL 1: USER WARNING ---------------- */}
      <AnimatePresence>
        {warningModalComment && (
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
                  <h3 className="text-base font-black">ইউজারকে সতর্কবার্তা পাঠান (Warning)</h3>
                  <p className="text-xs text-slate-500">প্রাপক: {warningModalComment.authorName}</p>
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
                  onClick={() => setWarningModalComment(null)}
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

      {/* ---------------- MODAL 2: DELETE COMMENT ---------------- */}
      <AnimatePresence>
        {deleteModalComment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-700">
                <div className="p-3 bg-rose-100 rounded-2xl">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">মন্তব্য স্থায়ীভাবে ডিলিট (Delete)</h3>
                  <p className="text-xs text-slate-500">লেখক: {deleteModalComment.authorName}</p>
                </div>
              </div>

              <p className="text-xs text-slate-700">
                আপনি কি নিশ্চিত যে এই মন্তব্যটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান?
              </p>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs italic text-slate-600">
                "{deleteModalComment.content}"
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalComment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'ডিলিট হচ্ছে...' : 'ডিলিট নিশ্চিত করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AddaCommentManagement;
