import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Film, 
  AlertTriangle, 
  TrendingUp, 
  Eye, 
  EyeOff, 
  Trash2, 
  RotateCcw, 
  Search, 
  Filter, 
  Heart, 
  MessageSquare, 
  Share2, 
  Clock, 
  User, 
  Pin, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  ShieldAlert, 
  Layers, 
  RefreshCw,
  Flame,
  AlertOctagon,
  MoreVertical,
  Calendar,
  Check,
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
  getDocs 
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { logAuditActivity } from '../../services/auditLogger';
import toast from 'react-hot-toast';

export type PostContentType = 'all' | 'image' | 'video' | 'text' | 'reel' | 'most_reported' | 'most_popular' | 'hidden';

export interface AdminManagedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorPhotoUrl?: string;
  authorBadge?: boolean;
  
  content: string;
  title?: string;
  category?: string;
  union?: string;
  
  // Media types
  contentType: 'image' | 'video' | 'text' | 'reel';
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  
  // Stats
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  reportsCount: number;
  viewsCount: number;
  
  // Flags
  isHidden: boolean;
  isPinned: boolean;
  isDeleted?: boolean;
  hideReason?: string;
  
  createdAt: string;
  updatedAt?: string;
}

// Bengali number helper
const toBn = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "০";
  return String(num).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
};

export const AddaPostManagement: React.FC = () => {
  const { user, userProfile } = useAuth();

  // State
  const [posts, setPosts] = useState<AdminManagedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<PostContentType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals & Preview
  const [selectedPost, setSelectedPost] = useState<AdminManagedPost | null>(null);
  
  // Hide Modal
  const [hideModalPost, setHideModalPost] = useState<AdminManagedPost | null>(null);
  const [hideReason, setHideReason] = useState('কমিউনিটি নির্দেশিকা বা নিয়মাবলী লঙ্ঘন');

  // Delete Modal
  const [deleteModalPost, setDeleteModalPost] = useState<AdminManagedPost | null>(null);

  // 1. Live Firestore Listener for Posts and Reels
  useEffect(() => {
    setLoading(true);
    try {
      const postsQuery = query(collection(db, 'posts'), limit(300));
      const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
        const fetchedList: AdminManagedPost[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();

          // Determine Content Type
          let type: 'image' | 'video' | 'text' | 'reel' = 'text';
          if (d.isReel || d.reelUrl || d.type === 'reel') {
            type = 'reel';
          } else if (d.videoUrl || (d.mediaType && d.mediaType.includes('video'))) {
            type = 'video';
          } else if (d.imageUrl || (d.imageUrls && d.imageUrls.length > 0) || (d.photos && d.photos.length > 0)) {
            type = 'image';
          } else {
            type = 'text';
          }

          fetchedList.push({
            id: docSnap.id,
            authorId: d.authorId || d.userId || d.uid || 'anon_user',
            authorName: d.authorName || d.userName || 'নাগরিক ব্যবহারকারী',
            authorUsername: d.authorUsername || d.username || '',
            authorPhotoUrl: d.authorPhotoUrl || d.userPhotoUrl || '',
            authorBadge: Boolean(d.authorBadge || d.isVerified),
            
            content: d.content || d.text || d.description || '',
            title: d.title || '',
            category: d.category || 'সাধারণ আড্ডা',
            union: d.union || 'পুঠিয়া',
            
            contentType: type,
            imageUrl: d.imageUrl || (d.imageUrls && d.imageUrls[0]) || (d.photos && d.photos[0]) || '',
            imageUrls: d.imageUrls || d.photos || (d.imageUrl ? [d.imageUrl] : []),
            videoUrl: d.videoUrl || d.reelUrl || '',
            thumbnailUrl: d.thumbnailUrl || d.thumbnail || '',
            
            likesCount: d.likesCount || d.likeCount || (d.likes ? (Array.isArray(d.likes) ? d.likes.length : 0) : 0),
            commentsCount: d.commentsCount || d.commentCount || 0,
            sharesCount: d.sharesCount || d.shareCount || 0,
            reportsCount: d.reportsCount || d.reportCount || 0,
            viewsCount: d.viewsCount || d.viewCount || (d.likesCount ? d.likesCount * 3 : 15),
            
            isHidden: Boolean(d.isHidden || d.hidden),
            isPinned: Boolean(d.isPinned || d.pinned),
            hideReason: d.hideReason || '',
            
            createdAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date(d.createdAt.seconds * 1000).toISOString()) : new Date().toISOString(),
            updatedAt: d.updatedAt ? (typeof d.updatedAt === 'string' ? d.updatedAt : new Date(d.updatedAt.seconds * 1000).toISOString()) : undefined
          });
        });

        // Sample Seeding if DB is fresh
        if (fetchedList.length === 0) {
          fetchedList.push(
            {
              id: 'post_seed_01',
              authorId: 'usr_01',
              authorName: 'মো. জসিম উদ্দিন',
              authorUsername: 'zosim_puthia',
              authorBadge: true,
              content: 'পুঠিয়া রাজবাড়ি চত্বরে আজ বিকেলে পরিষ্কার-পরিচ্ছন্নতা অভিযান সফলভাবে সম্পন্ন হয়েছে। সকল স্বেচ্ছাসেবী নাগরিককে আন্তরিক ধন্যবাদ!',
              title: 'রাজবাড়ি চত্বর পরিচ্ছন্নতা কর্মসূচি',
              category: 'সমাজসেবা',
              union: 'পুঠিয়া পৌরসভা',
              contentType: 'image',
              imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
              likesCount: 145,
              commentsCount: 28,
              sharesCount: 12,
              reportsCount: 0,
              viewsCount: 650,
              isHidden: false,
              isPinned: true,
              createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
            },
            {
              id: 'post_seed_02',
              authorId: 'usr_02',
              authorName: 'তাহমিনা আক্তার',
              authorUsername: 'tahmina_raj',
              authorBadge: false,
              content: 'পুঠিয়া আম বাজারে আজকের সর্বোচ্চ ও সর্বনিম্ন হিমসাগর ও ল্যাংড়া আমের দরদাম সংক্রান্ত পূর্ণাঙ্গ বিশ্লেষণমূলক ভিডিও ক্লিপ।',
              category: 'কৃষি ও বাজারদর',
              union: 'বানেশ্বর ইউনিয়ন',
              contentType: 'video',
              videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
              thumbnailUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800',
              likesCount: 380,
              commentsCount: 54,
              sharesCount: 39,
              reportsCount: 1,
              viewsCount: 1420,
              isHidden: false,
              isPinned: false,
              createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
            },
            {
              id: 'post_seed_03',
              authorId: 'usr_03',
              authorName: 'আরিফ আহমেদ',
              authorUsername: 'arif_puthia',
              authorBadge: false,
              content: 'পুঠিয়া শিব মন্দিরের সান্ধ্যকালীন অপরূপ দৃশ্য। স্থাপত্যের এক অপূর্ব নিদর্শন।',
              category: 'দর্শনীয় স্থান',
              union: 'পুঠিয়া পৌরসভা',
              contentType: 'reel',
              videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
              likesCount: 520,
              commentsCount: 89,
              sharesCount: 65,
              reportsCount: 0,
              viewsCount: 2900,
              isHidden: false,
              isPinned: false,
              createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
            },
            {
              id: 'post_seed_04',
              authorId: 'usr_04',
              authorName: 'স্প্যাম প্রচারক',
              authorUsername: 'spam_bot_01',
              authorBadge: false,
              content: 'ঘরে বসেই দৈনিক ৫০০০ টাকা আয় করার অফার! লিংকে ক্লিক করে রেজিস্ট্রেশন করুন...',
              category: 'সাধারণ আড্ডা',
              union: 'পুঠিয়া',
              contentType: 'text',
              likesCount: 2,
              commentsCount: 18,
              sharesCount: 0,
              reportsCount: 14,
              viewsCount: 210,
              isHidden: true,
              isPinned: false,
              hideReason: 'একাধিক নাগরিক রিপোর্ট ও ফিশিং স্প্যাম',
              createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString()
            }
          );
        }

        setPosts(fetchedList);
        setLoading(false);
      }, (err) => {
        console.error('Firestore posts onSnapshot error:', err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  // Filtered & Sorted Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      // 1. Content Type Filter
      if (activeFilter === 'image' && p.contentType !== 'image') return false;
      if (activeFilter === 'video' && p.contentType !== 'video') return false;
      if (activeFilter === 'text' && p.contentType !== 'text') return false;
      if (activeFilter === 'reel' && p.contentType !== 'reel') return false;
      if (activeFilter === 'most_reported' && p.reportsCount < 1) return false;
      if (activeFilter === 'most_popular' && p.likesCount < 10) return false;
      if (activeFilter === 'hidden' && !p.isHidden) return false;

      // 2. Category Filter
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.id.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.title && p.title.toLowerCase().includes(q)) ||
          p.authorName.toLowerCase().includes(q) ||
          (p.authorUsername && p.authorUsername.toLowerCase().includes(q)) ||
          (p.union && p.union.toLowerCase().includes(q))
        );
      }

      return true;
    }).sort((a, b) => {
      if (activeFilter === 'most_reported') {
        return b.reportsCount - a.reportsCount;
      }
      if (activeFilter === 'most_popular') {
        return (b.likesCount + b.commentsCount * 2 + b.sharesCount * 3) - (a.likesCount + a.commentsCount * 2 + a.sharesCount * 3);
      }
      // Pinned top, then newest
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, activeFilter, categoryFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: posts.length,
      image: posts.filter(p => p.contentType === 'image').length,
      video: posts.filter(p => p.contentType === 'video').length,
      text: posts.filter(p => p.contentType === 'text').length,
      reel: posts.filter(p => p.contentType === 'reel').length,
      most_reported: posts.filter(p => p.reportsCount > 0).length,
      most_popular: posts.filter(p => p.likesCount >= 10).length,
      hidden: posts.filter(p => p.isHidden).length,
    };
  }, [posts]);

  // ---------------- ACTION HANDLERS ---------------- //

  // 1. Hide Post
  const handleConfirmHide = async () => {
    if (!hideModalPost) return;
    setActionLoading(true);
    try {
      const postRef = doc(db, 'posts', hideModalPost.id);
      await updateDoc(postRef, {
        isHidden: true,
        hideReason: hideReason,
        moderatedBy: userProfile?.name || 'সুপার এডমিন',
        moderatedAt: serverTimestamp()
      });

      await logAuditActivity({
        action: 'HIDE_ADDA_POST',
        details: `সুপার এডমিন পোস্ট #${hideModalPost.id} (${hideModalPost.authorName}) টাইমলাইন থেকে লুকিয়েছেন। কারণ: ${hideReason}`,
        category: 'security',
        severity: 'warning',
        targetType: 'post',
        targetId: hideModalPost.id,
        targetName: hideModalPost.authorName
      });

      toast.success(`👁️‍🗨️ পোস্টটি টাইমলাইন থেকে সফলভাবে লুকানো (Hide) হয়েছে`);
      setHideModalPost(null);
      if (selectedPost?.id === hideModalPost.id) {
        setSelectedPost({ ...selectedPost, isHidden: true, hideReason });
      }
    } catch (err) {
      toast.error('পোস্ট লুকাতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Restore Post
  const handleRestorePost = async (postItem: AdminManagedPost) => {
    setActionLoading(true);
    try {
      const postRef = doc(db, 'posts', postItem.id);
      await updateDoc(postRef, {
        isHidden: false,
        hideReason: '',
        moderatedBy: userProfile?.name || 'সুপার এডমিন',
        restoredAt: serverTimestamp()
      });

      await logAuditActivity({
        action: 'RESTORE_ADDA_POST',
        details: `সুপার এডমিন পূর্বে লুকানো পোস্ট #${postItem.id} (${postItem.authorName}) পুনরায় টাইমলাইনে সচল করেছেন`,
        category: 'security',
        severity: 'info',
        targetType: 'post',
        targetId: postItem.id,
        targetName: postItem.authorName
      });

      toast.success(`♻️ পোস্টটি সফলভাবে পুনরুদ্ধার (Restore) করে সচল করা হয়েছে!`);
      if (selectedPost?.id === postItem.id) {
        setSelectedPost({ ...selectedPost, isHidden: false, hideReason: '' });
      }
    } catch (err) {
      toast.error('পোস্ট রিস্টোর করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Delete Post
  const handleConfirmDelete = async () => {
    if (!deleteModalPost) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'posts', deleteModalPost.id));

      await logAuditActivity({
        action: 'DELETE_ADDA_POST_PERMANENTLY',
        details: `সুপার এডমিন পোস্ট #${deleteModalPost.id} (${deleteModalPost.authorName}) ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলেছেন`,
        category: 'security',
        severity: 'critical',
        targetType: 'post',
        targetId: deleteModalPost.id,
        targetName: deleteModalPost.authorName
      });

      toast.success(`🗑️ পোস্টটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে`);
      setDeleteModalPost(null);
      if (selectedPost?.id === deleteModalPost.id) {
        setSelectedPost(null);
      }
    } catch (err) {
      toast.error('পোস্ট ডিলিট করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Toggle Pin Post
  const handleTogglePin = async (postItem: AdminManagedPost) => {
    const nextPin = !postItem.isPinned;
    setActionLoading(true);
    try {
      const postRef = doc(db, 'posts', postItem.id);
      await updateDoc(postRef, {
        isPinned: nextPin,
        pinnedAt: nextPin ? serverTimestamp() : null
      });

      await logAuditActivity({
        action: nextPin ? 'PIN_ADDA_POST' : 'UNPIN_ADDA_POST',
        details: `সুপার এডমিন পোস্ট #${postItem.id}-কে শীর্ষস্থানে ${nextPin ? 'পিন (Pin)' : 'আনপিন'} করেছেন`,
        category: 'system',
        severity: 'info',
        targetType: 'post',
        targetId: postItem.id
      });

      toast.success(nextPin ? `📌 পোস্টটি শীর্ষস্থানে পিন করা হয়েছে!` : `পোস্টটি আনপিন করা হয়েছে`);
      if (selectedPost?.id === postItem.id) {
        setSelectedPost({ ...selectedPost, isPinned: nextPin });
      }
    } catch (err) {
      toast.error('পিন স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
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
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-teal-300/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-xs shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                  পোস্ট কমান্ড হাব
                </span>
                <span className="text-[11px] font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  মোট পোস্ট: {toBn(counts.all)}টি
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                আড্ডা পোস্ট ও কন্টেন্ট ম্যানেজমেন্ট
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-2xl">
                ছবি পোস্ট, ভিডিও, টেক্সট, রিলস, ভাইরাল ও ফ্ল্যাগড পোস্ট পর্যবেক্ষণ এবং হাইড, রিস্টোর ও ডিলিট সুপার এডমিন কন্ট্রোল
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-emerald-950/70 px-4 py-2 rounded-2xl border border-emerald-400/30 backdrop-blur-md text-xs font-bold text-emerald-200">
              লুকানো পোস্ট: <strong className="text-rose-300 font-black">{toBn(counts.hidden)}</strong>টি
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER METRIC CARDS (সব পোস্ট, ছবি, ভিডিও, Text, Reels, সবচেয়ে বেশি রিপোর্ট, সবচেয়ে জনপ্রিয়) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { id: 'all', label: 'সব পোস্ট', count: counts.all, icon: Layers, color: 'text-[#0B7A3B] bg-emerald-50 border-emerald-200' },
          { id: 'image', label: 'ছবি পোস্ট', count: counts.image, icon: ImageIcon, color: 'text-purple-700 bg-purple-50 border-purple-200' },
          { id: 'video', label: 'ভিডিও পোস্ট', count: counts.video, icon: Video, color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { id: 'text', label: 'Text পোস্ট', count: counts.text, icon: FileText, color: 'text-teal-700 bg-teal-50 border-teal-200' },
          { id: 'reel', label: 'Reels', count: counts.reel, icon: Film, color: 'text-rose-700 bg-rose-50 border-rose-200' },
          { id: 'most_reported', label: 'বেশি রিপোর্ট', count: counts.most_reported, icon: AlertTriangle, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { id: 'most_popular', label: 'সবচেয়ে জনপ্রিয়', count: counts.most_popular, icon: Flame, color: 'text-orange-700 bg-orange-50 border-orange-200' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveFilter(item.id as PostContentType)}
            className={`p-3 min-h-[82px] rounded-2xl border transition-all flex flex-col justify-between text-left cursor-pointer ${
              activeFilter === item.id 
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

      {/* 3. SEARCH & CONTROLS */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="পোস্টের বিবরণ, পোস্ট আইডি, লেখক বা ইউনিয়ন দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-emerald-200 text-slate-900 rounded-xl text-sm font-bold placeholder-slate-400 focus:outline-none focus:border-[#0B7A3B]"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm font-bold text-slate-700">
              <Filter size={14} className="text-[#0B7A3B]" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">সকল ক্যাটাগরি</option>
                <option value="সাধারণ আড্ডা">সাধারণ আড্ডা</option>
                <option value="সমাজসেবা">সমাজসেবা</option>
                <option value="কৃষি ও বাজারদর">কৃষি ও বাজারদর</option>
                <option value="দর্শনীয় স্থান">দর্শনীয় স্থান</option>
                <option value="শিক্ষা ও ক্যারিয়ার">শিক্ষা ও ক্যারিয়ার</option>
                <option value="জরুরি নোটিশ">জরুরি নোটিশ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Filter Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none max-w-full">
          {[
            { id: 'all', label: `সব পোস্ট (${toBn(counts.all)})` },
            { id: 'image', label: `🖼️ ছবি পোস্ট (${toBn(counts.image)})` },
            { id: 'video', label: `🎬 ভিডিও (${toBn(counts.video)})` },
            { id: 'reel', label: `⚡ Reels (${toBn(counts.reel)})` },
            { id: 'text', label: `📝 Text পোস্ট (${toBn(counts.text)})` },
            { id: 'most_reported', label: `⚠️ সর্বাধিক রিপোর্টকৃত (${toBn(counts.most_reported)})` },
            { id: 'most_popular', label: `🔥 সবচেয়ে জনপ্রিয় (${toBn(counts.most_popular)})` },
            { id: 'hidden', label: `👁️‍🗨️ লুকানো পোস্ট (${toBn(counts.hidden)})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-sm sm:text-base font-black transition-all whitespace-nowrap shrink-0 min-w-max cursor-pointer border ${
                activeFilter === tab.id
                  ? 'bg-[#0B7A3B] text-white border-[#0B7A3B] shadow-xs scale-[1.02]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. POSTS GRID / LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-emerald-100 shadow-2xs">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0B7A3B] mb-2" />
            <p className="text-xs font-bold">পোস্ট ডাটাবেজ লোড হচ্ছে...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-500 border border-emerald-100 shadow-2xs">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-80" />
            <p className="text-sm font-black text-slate-800">কোনো পোস্ট পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-1">অন্য কোনো ফিল্টার বা অনুসন্ধান শব্দ ব্যবহার করে দেখুন</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className={`bg-white rounded-3xl border p-5 transition-all shadow-2xs space-y-3 ${
                post.isHidden 
                  ? 'border-rose-200 bg-rose-50/10' 
                  : post.isPinned 
                  ? 'border-emerald-300 bg-emerald-50/20' 
                  : 'border-emerald-100 hover:border-emerald-300'
              }`}
            >
              {/* Card Header: Author, Type, Pinned & Hidden badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {post.authorPhotoUrl ? (
                      <img src={post.authorPhotoUrl} alt="" className="w-9 h-9 rounded-xl object-cover border border-emerald-200" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B7A3B] to-teal-700 text-white flex items-center justify-center font-black text-xs">
                        {post.authorName[0] || 'U'}
                      </div>
                    )}
                    {post.authorBadge && (
                      <span className="absolute -bottom-1 -right-1 p-0.5 bg-blue-600 text-white rounded-full text-[8px] font-bold">✓</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-slate-900 text-xs">{post.authorName}</span>
                      {post.authorUsername && (
                        <span className="text-[11px] text-slate-400 font-mono">@{post.authorUsername}</span>
                      )}
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold">
                        {post.union || 'পুঠিয়া'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      আইডি: <span className="font-mono text-[10px]">{post.id}</span> • {new Date(post.createdAt).toLocaleString('bn-BD')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Content Type Pill */}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white flex items-center gap-1">
                    {post.contentType === 'image' && <ImageIcon size={10} />}
                    {post.contentType === 'video' && <Video size={10} />}
                    {post.contentType === 'reel' && <Film size={10} />}
                    {post.contentType === 'text' && <FileText size={10} />}
                    <span>{post.contentType.toUpperCase()}</span>
                  </span>

                  {/* Pinned Badge */}
                  {post.isPinned && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Pin size={10} /> পিন্ড
                    </span>
                  )}

                  {/* Hidden Badge */}
                  {post.isHidden ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <EyeOff size={10} /> লুকানো (Hidden)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      সক্রিয়
                    </span>
                  )}

                  {/* Reports Count Badge */}
                  {post.reportsCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse flex items-center gap-1">
                      <AlertTriangle size={10} /> {toBn(post.reportsCount)}টি রিপোর্ট
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body: Text Content & Media */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className={post.imageUrl || post.videoUrl ? "lg:col-span-3 space-y-2" : "lg:col-span-4 space-y-2"}>
                  {post.title && (
                    <h3 className="text-sm font-black text-slate-900">{post.title}</h3>
                  )}
                  <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* If hidden, show reason */}
                  {post.hideReason && (
                    <div className="p-2 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-800 font-bold">
                      লুকানোর কারণ: {post.hideReason}
                    </div>
                  )}

                  {/* Stats Footer (Likes, Comments, Shares, Views) */}
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-1">
                    <span className="flex items-center gap-1 text-rose-600">
                      <Heart size={13} /> {toBn(post.likesCount)} লাইক
                    </span>
                    <span className="flex items-center gap-1 text-blue-600">
                      <MessageSquare size={13} /> {toBn(post.commentsCount)} কমেন্ট
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Share2 size={13} /> {toBn(post.sharesCount)} শেয়ার
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Eye size={13} /> {toBn(post.viewsCount)} ভিউ
                    </span>
                  </div>
                </div>

                {/* Media Thumbnail */}
                {(post.imageUrl || post.videoUrl || post.thumbnailUrl) && (
                  <div className="lg:col-span-1">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video lg:aspect-square bg-slate-950 flex items-center justify-center">
                      {post.imageUrl ? (
                        <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : post.thumbnailUrl ? (
                        <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-slate-400 p-2">
                          <Video size={24} className="mx-auto mb-1 text-emerald-400" />
                          <span className="text-[10px] font-bold">ভিডিও কন্টেন্ট</span>
                        </div>
                      )}
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-black rounded">
                        {post.contentType.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: ACTION BUTTONS (Hide, Restore, Delete, Pin, Preview) */}
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Sparkles size={12} className="text-[#0B7A3B]" />
                  <span>কমান্ড অ্যাকশন:</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Preview Modal Button */}
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0B7A3B] border border-emerald-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                  >
                    <Eye size={13} /> প্রিভিউ
                  </button>

                  {/* Pin / Unpin Button */}
                  <button
                    onClick={() => handleTogglePin(post)}
                    disabled={actionLoading}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                      post.isPinned
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Pin size={13} /> {post.isPinned ? 'আনপিন' : 'পিন করুন'}
                  </button>

                  {/* Hide or Restore Button */}
                  {post.isHidden ? (
                    <button
                      onClick={() => handleRestorePost(post)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <RotateCcw size={13} /> Post Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setHideModalPost(post);
                        setHideReason('কমিউনিটি নির্দেশিকা বা নিয়মাবলী লঙ্ঘন');
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                    >
                      <EyeOff size={13} /> পোস্ট Hide
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeleteModalPost(post)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ---------------- MODAL 1: PREVIEW POST ---------------- */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-emerald-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">পোস্ট সম্পূর্ণ প্রিভিউ</h3>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Author Banner */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900">{selectedPost.authorName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">@{selectedPost.authorUsername || 'citizen'}</p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                  {selectedPost.union}
                </span>
              </div>

              {/* Post Content */}
              <div className="space-y-2 text-xs text-slate-800">
                {selectedPost.title && <h4 className="text-sm font-black text-slate-900">{selectedPost.title}</h4>}
                <p className="whitespace-pre-line leading-relaxed">{selectedPost.content}</p>
              </div>

              {/* Media Preview */}
              {selectedPost.imageUrl && (
                <img src={selectedPost.imageUrl} alt="" className="w-full rounded-2xl border border-slate-200 object-cover max-h-72" />
              )}
              {selectedPost.videoUrl && (
                <video src={selectedPost.videoUrl} controls className="w-full rounded-2xl border border-slate-200 max-h-72 bg-black" />
              )}

              {/* Engagement Stats */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-[10px] text-slate-500 font-bold">লাইক</p>
                  <p className="text-sm font-black text-rose-600">{toBn(selectedPost.likesCount)}</p>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-[10px] text-slate-500 font-bold">কমেন্ট</p>
                  <p className="text-sm font-black text-blue-600">{toBn(selectedPost.commentsCount)}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[10px] text-slate-500 font-bold">শেয়ার</p>
                  <p className="text-sm font-black text-[#0B7A3B]">{toBn(selectedPost.sharesCount)}</p>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-[10px] text-slate-500 font-bold">রিপোর্ট</p>
                  <p className="text-sm font-black text-amber-700">{toBn(selectedPost.reportsCount)}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 2: HIDE POST ---------------- */}
      <AnimatePresence>
        {hideModalPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-700">
                <div className="p-3 bg-amber-100 rounded-2xl">
                  <EyeOff size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">পোস্ট পাবলিক ফিড থেকে লুকান</h3>
                  <p className="text-xs text-slate-500">লেখক: {hideModalPost.authorName}</p>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-700 space-y-1">
                <label className="text-slate-500">লুকানোর কারণ উল্লেখ করুন:</label>
                <textarea
                  rows={3}
                  value={hideReason}
                  onChange={(e) => setHideReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHideModalPost(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmHide}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'লুকানো হচ্ছে...' : 'পোস্ট Hide করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 3: DELETE POST ---------------- */}
      <AnimatePresence>
        {deleteModalPost && (
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
                  <h3 className="text-base font-black">পোস্ট স্থায়ীভাবে ডিলিট (Delete)</h3>
                  <p className="text-xs text-slate-500">আইডি: {deleteModalPost.id}</p>
                </div>
              </div>

              <p className="text-xs text-slate-700">
                আপনি কি নিশ্চিত যে এই পোস্টটি এবং এর সাথে সম্পর্কিত সকল মন্তব্য ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalPost(null)}
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

export default AddaPostManagement;
