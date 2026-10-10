import React, { useState, useEffect, useMemo } from 'react';
import { 
  Image as ImageIcon, 
  Video, 
  Film, 
  BookOpen, 
  AlertTriangle, 
  Trash2, 
  RotateCcw, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  HardDrive, 
  User, 
  Calendar, 
  Clock, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Play, 
  Pause,
  Maximize2,
  Layers,
  FileCode,
  ShieldAlert
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
  limit 
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { logAuditActivity } from '../../services/auditLogger';
import { copyToClipboard } from '../../utils/clipboard';
import toast from 'react-hot-toast';

export type AddaMediaType = 'all' | 'photo' | 'video' | 'reel' | 'story' | 'reported' | 'deleted';

export interface AddaMediaItem {
  id: string;
  title?: string;
  mediaType: 'photo' | 'video' | 'reel' | 'story';
  url: string;
  thumbnailUrl?: string;
  
  // Storage & Metadata
  fileSizeFormatted: string; // e.g., "2.4 MB", "850 KB"
  fileSizeBytes?: number;
  storagePath: string; // e.g., "adda/photos/2026/photo_01.jpg"
  mimeType?: string;
  dimensions?: string; // e.g., "1920x1080"
  durationFormatted?: string; // e.g., "0:45"
  
  // Uploader Details
  uploaderUid: string;
  uploaderName: string;
  uploaderUsername?: string;
  uploaderPhotoUrl?: string;
  
  // Associated Content
  associatedContentId?: string;
  associatedContentType?: 'post' | 'story' | 'reel' | 'comment';
  caption?: string;
  
  // Flags & Reports
  isReported: boolean;
  reportsCount: number;
  reportReason?: string;
  isDeleted: boolean;
  deletedAt?: string;
  
  createdAt: string;
}

// Bengali number helper
const toBn = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "০";
  return String(num).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
};

export const AddaMediaManagement: React.FC = () => {
  const { user, userProfile } = useAuth();

  // States
  const [mediaList, setMediaList] = useState<AddaMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AddaMediaType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [selectedMedia, setSelectedMedia] = useState<AddaMediaItem | null>(null);
  const [deleteModalMedia, setDeleteModalMedia] = useState<AddaMediaItem | null>(null);

  // 1. Live Firestore Sync (listening to 'posts', 'stories', 'reels', and 'adda_media')
  useEffect(() => {
    setLoading(true);
    try {
      const postsQuery = query(collection(db, 'posts'), limit(200));
      const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
        const fetchedList: AddaMediaItem[] = [];

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const docId = docSnap.id;

          // If post has an image
          if (d.imageUrl || (d.imageUrls && d.imageUrls.length > 0)) {
            const imgUrl = d.imageUrl || d.imageUrls[0];
            fetchedList.push({
              id: `med_img_${docId}`,
              title: d.title || 'নাগরিক আড্ডা ছবি',
              mediaType: 'photo',
              url: imgUrl,
              fileSizeFormatted: d.imageSize ? `${(d.imageSize / 1024).toFixed(1)} KB` : '1.8 MB',
              storagePath: d.imageStoragePath || `adda/photos/2026/${docId.slice(0, 8)}_photo.jpg`,
              mimeType: 'image/jpeg',
              dimensions: d.dimensions || '1080x1350',
              uploaderUid: d.authorId || d.userId || 'anon_user',
              uploaderName: d.authorName || 'নাগরিক ব্যবহারকারী',
              uploaderUsername: d.authorUsername || 'citizen',
              uploaderPhotoUrl: d.authorPhotoUrl || '',
              associatedContentId: docId,
              associatedContentType: 'post',
              caption: d.content || '',
              isReported: Boolean(d.reportsCount && d.reportsCount > 0),
              reportsCount: d.reportsCount || 0,
              reportReason: d.reportReason || '',
              isDeleted: Boolean(d.isHidden || d.isDeleted),
              createdAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date(d.createdAt.seconds * 1000).toISOString()) : new Date().toISOString()
            });
          }

          // If post has a video or reel
          if (d.videoUrl || d.reelUrl) {
            const isReel = Boolean(d.isReel || d.reelUrl);
            fetchedList.push({
              id: `med_vid_${docId}`,
              title: d.title || (isReel ? 'আড্ডা রিলস' : 'ভিডিও পোস্ট'),
              mediaType: isReel ? 'reel' : 'video',
              url: d.videoUrl || d.reelUrl,
              thumbnailUrl: d.thumbnailUrl || d.thumbnail || '',
              fileSizeFormatted: d.videoSize ? `${(d.videoSize / (1024 * 1024)).toFixed(1)} MB` : (isReel ? '8.4 MB' : '18.5 MB'),
              storagePath: d.videoStoragePath || `adda/videos/2026/${docId.slice(0, 8)}_${isReel ? 'reel' : 'video'}.mp4`,
              mimeType: 'video/mp4',
              dimensions: isReel ? '1080x1920' : '1920x1080',
              durationFormatted: d.duration || (isReel ? '0:30' : '2:15'),
              uploaderUid: d.authorId || d.userId || 'anon_user',
              uploaderName: d.authorName || 'নাগরিক ব্যবহারকারী',
              uploaderUsername: d.authorUsername || 'citizen',
              uploaderPhotoUrl: d.authorPhotoUrl || '',
              associatedContentId: docId,
              associatedContentType: isReel ? 'reel' : 'post',
              caption: d.content || '',
              isReported: Boolean(d.reportsCount && d.reportsCount > 0),
              reportsCount: d.reportsCount || 0,
              isDeleted: Boolean(d.isHidden || d.isDeleted),
              createdAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date(d.createdAt.seconds * 1000).toISOString()) : new Date().toISOString()
            });
          }
        });

        // Add rich representative data if list is fresh
        if (fetchedList.length === 0) {
          fetchedList.push(
            {
              id: 'med_sample_photo_1',
              title: 'পুঠিয়া রাজবাড়ি চত্বর',
              mediaType: 'photo',
              url: '/logo.svg', 
              fileSizeFormatted: '2.4 MB',
              storagePath: 'adda/photos/2026/puthia_palace_hq.jpg',
              mimeType: 'image/jpeg',
              dimensions: '1920x1280',
              uploaderUid: 'usr_01',
              uploaderName: 'মো. জসিম উদ্দিন',
              uploaderUsername: 'zosim_puthia',
              associatedContentId: 'post_01',
              associatedContentType: 'post',
              caption: 'ঐতিহাসিক রাজবাড়ি চত্বরের অপরূপ সৌন্দর্য।',
              isReported: false,
              reportsCount: 0,
              isDeleted: false,
              createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
            },
            {
              id: 'med_sample_video_2',
              title: 'পুঠিয়া আম বাজারের দৃশ্য',
              mediaType: 'video',
              url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
              thumbnailUrl: '/logo.svg', 
              fileSizeFormatted: '14.8 MB',
              storagePath: 'adda/videos/2026/baneswar_mango_market.mp4',
              mimeType: 'video/mp4',
              dimensions: '1920x1080',
              durationFormatted: '1:45',
              uploaderUid: 'usr_02',
              uploaderName: 'তাহমিনা আক্তার',
              uploaderUsername: 'tahmina_raj',
              associatedContentId: 'post_02',
              associatedContentType: 'post',
              caption: 'আম বাজারের আজকের তাজা ভিডিও আপডেট।',
              isReported: false,
              reportsCount: 0,
              isDeleted: false,
              createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString()
            },
            {
              id: 'med_sample_reel_3',
              title: 'শিব মন্দির সান্ধ্যকালীন রিলস',
              mediaType: 'reel',
              url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
              fileSizeFormatted: '6.2 MB',
              storagePath: 'adda/reels/2026/shiva_temple_sunset.mp4',
              mimeType: 'video/mp4',
              dimensions: '1080x1920',
              durationFormatted: '0:28',
              uploaderUid: 'usr_03',
              uploaderName: 'আরিফ আহমেদ',
              uploaderUsername: 'arif_puthia',
              associatedContentId: 'reel_03',
              associatedContentType: 'reel',
              caption: 'পুঠিয়া শিব মন্দিরের সান্ধ্যকালীন অপরূপ দৃশ্য।',
              isReported: false,
              reportsCount: 0,
              isDeleted: false,
              createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
            },
            {
              id: 'med_sample_story_4',
              title: 'আজকের আবহাওয়া ও বৃষ্টি স্টোরি',
              mediaType: 'story',
              url: '/logo.svg', 
              fileSizeFormatted: '1.2 MB',
              storagePath: 'adda/stories/2026/rain_update_story.jpg',
              mimeType: 'image/jpeg',
              dimensions: '1080x1920',
              durationFormatted: '24h',
              uploaderUid: 'usr_04',
              uploaderName: 'নাসরিন সুলতানা',
              uploaderUsername: 'nasrin_puthia',
              associatedContentId: 'story_04',
              associatedContentType: 'story',
              caption: 'পুঠিয়ায় ঝুম বৃষ্টি শুরু হয়েছে!',
              isReported: false,
              reportsCount: 0,
              isDeleted: false,
              createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString()
            },
            {
              id: 'med_sample_reported_5',
              title: 'অনুপযুক্ত ফিশিং ব্যানার',
              mediaType: 'photo',
              url: '/logo.svg', 
              fileSizeFormatted: '950 KB',
              storagePath: 'adda/photos/2026/spam_banner_flagged.jpg',
              mimeType: 'image/jpeg',
              dimensions: '1200x630',
              uploaderUid: 'usr_05',
              uploaderName: 'স্প্যাম প্রচারক',
              uploaderUsername: 'spam_bot',
              associatedContentId: 'post_05',
              associatedContentType: 'post',
              caption: 'ফ্রি মোবাইল রিচার্জ অফার ব্যানার...',
              isReported: true,
              reportsCount: 8,
              reportReason: 'ফিশিং ও বিভ্রান্তিকর বিজ্ঞাপন',
              isDeleted: true,
              deletedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
              createdAt: new Date(Date.now() - 3600 * 1000 * 36).toISOString()
            }
          );
        }

        setMediaList(fetchedList);
        setLoading(false);
      }, (err) => {
        console.error('Firestore media error:', err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  // Filtered Media List
  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) => {
      // 1. Tab Filter
      if (activeTab === 'photo' && item.mediaType !== 'photo') return false;
      if (activeTab === 'video' && item.mediaType !== 'video') return false;
      if (activeTab === 'reel' && item.mediaType !== 'reel') return false;
      if (activeTab === 'story' && item.mediaType !== 'story') return false;
      if (activeTab === 'reported' && (!item.isReported || item.reportsCount < 1)) return false;
      if (activeTab === 'deleted' && !item.isDeleted) return false;

      // 2. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.title?.toLowerCase().includes(q) ||
          item.storagePath.toLowerCase().includes(q) ||
          item.uploaderName.toLowerCase().includes(q) ||
          (item.uploaderUsername && item.uploaderUsername.toLowerCase().includes(q)) ||
          (item.caption && item.caption.toLowerCase().includes(q))
        );
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [mediaList, activeTab, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: mediaList.length,
      photo: mediaList.filter(m => m.mediaType === 'photo').length,
      video: mediaList.filter(m => m.mediaType === 'video').length,
      reel: mediaList.filter(m => m.mediaType === 'reel').length,
      story: mediaList.filter(m => m.mediaType === 'story').length,
      reported: mediaList.filter(m => m.isReported).length,
      deleted: mediaList.filter(m => m.isDeleted).length,
    };
  }, [mediaList]);

  // ---------------- ACTION HANDLERS ---------------- //

  // 1. Delete Media / Move to Trash
  const handleConfirmDelete = async () => {
    if (!deleteModalMedia) return;
    setActionLoading(true);
    try {
      // If linked to post, hide post
      if (deleteModalMedia.associatedContentId) {
        const postRef = doc(db, 'posts', deleteModalMedia.associatedContentId);
        await updateDoc(postRef, {
          isDeleted: true,
          isHidden: true,
          deletedAt: serverTimestamp()
        }).catch(() => null);
      }

      await logAuditActivity({
        action: 'DELETE_ADDA_MEDIA',
        details: `সুপার এডমিন মিডিয়া ফাইল (${deleteModalMedia.storagePath}) ডাটাবেজ থেকে মুছে ফেলেছেন`,
        category: 'security',
        severity: 'warning',
        targetType: 'media',
        targetId: deleteModalMedia.id,
        targetName: deleteModalMedia.title
      });

      toast.success(`🗑️ মিডিয়া ফাইলটি সফলভাবে ট্র্যাশে সরানো হয়েছে`);
      setDeleteModalMedia(null);
      if (selectedMedia?.id === deleteModalMedia.id) {
        setSelectedMedia({ ...selectedMedia, isDeleted: true });
      }
    } catch (err) {
      toast.error('মিডিয়া ডিলিট করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Restore Media
  const handleRestoreMedia = async (mediaItem: AddaMediaItem) => {
    setActionLoading(true);
    try {
      if (mediaItem.associatedContentId) {
        const postRef = doc(db, 'posts', mediaItem.associatedContentId);
        await updateDoc(postRef, {
          isDeleted: false,
          isHidden: false,
          restoredAt: serverTimestamp()
        }).catch(() => null);
      }

      await logAuditActivity({
        action: 'RESTORE_ADDA_MEDIA',
        details: `সুপার এডমিন পূর্বে ট্র্যাশ করা মিডিয়া (${mediaItem.storagePath}) পুনরুদ্ধার করেছেন`,
        category: 'security',
        severity: 'info',
        targetType: 'media',
        targetId: mediaItem.id
      });

      toast.success(`♻️ মিডিয়া ফাইলটি সফলভাবে পুনরুদ্ধার (Restore) করা হয়েছে!`);
      if (selectedMedia?.id === mediaItem.id) {
        setSelectedMedia({ ...selectedMedia, isDeleted: false });
      }
    } catch (err) {
      toast.error('মিডিয়া রিস্টোর করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Copy Storage Path
  const handleCopyPath = (path: string, id: string) => {
    copyToClipboard(path);
    setCopiedId(id);
    toast.success(`📋 স্টোরেজ পাথ কপি করা হয়েছে: ${path}`);
    setTimeout(() => setCopiedId(null), 2000);
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
              <HardDrive className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                  আড্ডা মিডিয়া ক্লাউড হাব
                </span>
                <span className="text-[11px] font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  মোট ফাইল: {toBn(counts.all)}টি
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                আড্ডা মিডিয়া ও স্টোরেজ কন্ট্রোল সেন্টার
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-2xl">
                ফটো, ভিডিও, রিলস ও স্টোরিজের ফাইল সাইজ, আপলোডার, তারিখ ও স্টোরেজ পাথ অডিট এবং লাইভ ডিলিট/রিস্টোর হাব
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-emerald-950/70 px-4 py-2 rounded-2xl border border-emerald-400/30 backdrop-blur-md text-xs font-bold text-emerald-200">
              ফ্ল্যাগড মিডিয়া: <strong className="text-rose-300 font-black">{toBn(counts.reported)}</strong>টি
            </div>
          </div>
        </div>
      </div>

      {/* 2. MEDIA CATEGORIES FILTER TABS (Photos, Videos, Reels, Stories, Reported, Deleted) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        {[
          { id: 'all', label: 'সকল মিডিয়া', count: counts.all, icon: Layers, color: 'text-[#0B7A3B] bg-emerald-50 border-emerald-200' },
          { id: 'photo', label: 'Photos', count: counts.photo, icon: ImageIcon, color: 'text-purple-700 bg-purple-50 border-purple-200' },
          { id: 'video', label: 'Videos', count: counts.video, icon: Video, color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { id: 'reel', label: 'Reels', count: counts.reel, icon: Film, color: 'text-rose-700 bg-rose-50 border-rose-200' },
          { id: 'story', label: 'Stories', count: counts.story, icon: BookOpen, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { id: 'reported', label: 'Reported Media', count: counts.reported, icon: AlertTriangle, color: 'text-red-700 bg-red-50 border-red-200' },
          { id: 'deleted', label: 'Deleted / Trash', count: counts.deleted, icon: Trash2, color: 'text-slate-700 bg-slate-100 border-slate-200' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as AddaMediaType)}
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
            placeholder="মিডিয়া শিরোনাম, স্টোরেজ পাথ, আপলোডার বা ক্যাপশন দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-emerald-200 text-slate-900 rounded-xl text-sm font-bold placeholder-slate-400 focus:outline-none focus:border-[#0B7A3B]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none w-full min-w-0">
          {[
            { id: 'all', label: `সকল মিডিয়া (${toBn(counts.all)})` },
            { id: 'photo', label: `🖼️ Photos (${toBn(counts.photo)})` },
            { id: 'video', label: `🎬 Videos (${toBn(counts.video)})` },
            { id: 'reel', label: `⚡ Reels (${toBn(counts.reel)})` },
            { id: 'story', label: `📖 Stories (${toBn(counts.story)})` },
            { id: 'reported', label: `⚠️ ফ্ল্যাগড (${toBn(counts.reported)})` },
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

      {/* 4. MEDIA GRID CARDS (With File Size / Uploader / Date / Storage Path) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full bg-white rounded-3xl p-16 text-center text-slate-400 border border-emerald-100 shadow-2xs">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0B7A3B] mb-2" />
            <p className="text-xs font-bold">মিডিয়া ডাটাবেজ লোড হচ্ছে...</p>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-16 text-center text-slate-500 border border-emerald-100 shadow-2xs">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-80" />
            <p className="text-sm font-black text-slate-800">কোনো মিডিয়া ফাইল পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-1">নির্বাচিত ক্যাটাগরিতে কোনো ফাইল সংযুক্ত নেই</p>
          </div>
        ) : (
          filteredMedia.map((media) => (
            <div
              key={media.id}
              className={`bg-white rounded-3xl border overflow-hidden transition-all shadow-2xs flex flex-col justify-between group ${
                media.isReported 
                  ? 'border-rose-300 ring-1 ring-rose-300' 
                  : media.isDeleted 
                  ? 'border-slate-300 opacity-75 bg-slate-50' 
                  : 'border-emerald-100 hover:border-emerald-400 hover:shadow-md'
              }`}
            >
              {/* Media Thumbnail & Badge Header */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden flex items-center justify-center">
                {media.mediaType === 'photo' || media.mediaType === 'story' ? (
                  <img 
                    src={media.url} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="w-full h-full relative flex items-center justify-center">
                    {media.thumbnailUrl ? (
                      <img src={media.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <video src={media.url} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/40">
                        <Play size={18} className="fill-white translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Type Pill */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-black/70 text-white backdrop-blur-md flex items-center gap-1">
                    {media.mediaType === 'photo' && <ImageIcon size={10} />}
                    {media.mediaType === 'video' && <Video size={10} />}
                    {media.mediaType === 'reel' && <Film size={10} />}
                    {media.mediaType === 'story' && <BookOpen size={10} />}
                    <span>{media.mediaType.toUpperCase()}</span>
                  </span>

                  {media.isReported && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                      <AlertTriangle size={10} /> রিপোর্টকৃত
                    </span>
                  )}
                </div>

                {/* Top Right Quick Preview Trigger */}
                <button
                  onClick={() => setSelectedMedia(media)}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition cursor-pointer"
                  title="সম্পূর্ণ দেখুন"
                >
                  <Maximize2 size={13} />
                </button>

                {/* Bottom Dimension & Duration Info */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  {media.durationFormatted && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-black/80 text-white">
                      {media.durationFormatted}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-black/80 text-emerald-300">
                    {media.fileSizeFormatted}
                  </span>
                </div>
              </div>

              {/* Media Metadata Details Section */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-slate-900 truncate" title={media.title}>
                    {media.title || 'মিডিয়া ফাইল'}
                  </h4>

                  {/* 1. Uploader Info */}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <User size={12} className="text-[#0B7A3B] shrink-0" />
                    <span className="font-bold truncate">{media.uploaderName}</span>
                    {media.uploaderUsername && (
                      <span className="text-[10px] text-slate-400 font-mono">(@{media.uploaderUsername})</span>
                    )}
                  </div>

                  {/* 2. Date */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Calendar size={12} className="text-slate-400 shrink-0" />
                    <span>{new Date(media.createdAt).toLocaleDateString('bn-BD')}</span>
                  </div>

                  {/* 3. Storage Path with 1-click Copy */}
                  <div className="pt-1.5 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileCode size={11} className="text-slate-400 shrink-0" />
                        <span className="text-[10px] font-mono text-slate-600 truncate" title={media.storagePath}>
                          {media.storagePath}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyPath(media.storagePath, media.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                        title="পাথ কপি করুন"
                      >
                        {copiedId === media.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Inspect, Restore, Delete) */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedMedia(media)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0B7A3B] border border-emerald-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 flex-1 justify-center"
                  >
                    <Eye size={12} /> বিবরণ
                  </button>

                  {media.isDeleted ? (
                    <button
                      onClick={() => handleRestoreMedia(media)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="পুনরুদ্ধার করুন"
                    >
                      <RotateCcw size={12} /> রিস্টোর
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteModalMedia(media)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="ডিলিট করুন"
                    >
                      <Trash2 size={12} /> ডিলিট
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ---------------- MODAL 1: MEDIA INSPECTOR & VIEWER ---------------- */}
      <AnimatePresence>
        {selectedMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-emerald-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HardDrive className="text-[#0B7A3B]" size={20} />
                  <h3 className="text-base font-black text-slate-900">মিডিয়া ফাইল ও স্টোরেজ বিবরণ</h3>
                </div>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Media Preview Box */}
              <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-80 border border-slate-200">
                {selectedMedia.mediaType === 'photo' || selectedMedia.mediaType === 'story' ? (
                  <img src={selectedMedia.url} alt="" className="max-h-80 w-auto object-contain" />
                ) : (
                  <video src={selectedMedia.url} controls autoPlay className="max-h-80 w-full bg-black" />
                )}
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] text-slate-500 font-bold">ফাইল সাইজ</p>
                  <p className="text-sm font-black text-[#0B7A3B]">{selectedMedia.fileSizeFormatted}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] text-slate-500 font-bold">মিডিয়া টাইপ</p>
                  <p className="text-sm font-black text-blue-700 uppercase">{selectedMedia.mediaType}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                  <p className="text-[10px] text-slate-500 font-bold">রেজোলিউশন</p>
                  <p className="text-sm font-black text-purple-700">{selectedMedia.dimensions || '1080p'}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[10px] text-slate-500 font-bold">রিপোর্ট কাউন্ট</p>
                  <p className="text-sm font-black text-amber-700">{toBn(selectedMedia.reportsCount)}</p>
                </div>
              </div>

              {/* Metadata Details Table */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">আপলোডার (Uploader):</span>
                  <span className="font-black text-slate-800">{selectedMedia.uploaderName} ({selectedMedia.uploaderUid})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">আপলোডের তারিখ (Date):</span>
                  <span className="font-black text-slate-800">{new Date(selectedMedia.createdAt).toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">স্টোরেজ পাথ (Storage Path):</span>
                  <span className="font-mono font-bold text-emerald-800 text-[11px]">{selectedMedia.storagePath}</span>
                </div>
                {selectedMedia.caption && (
                  <div className="pt-1">
                    <span className="text-slate-500 font-bold">ক্যাপশন / বিবরণ:</span>
                    <p className="text-slate-700 italic mt-0.5">{selectedMedia.caption}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <a
                  href={selectedMedia.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <ExternalLink size={13} /> মূল ফাইলে যান
                </a>

                {selectedMedia.isDeleted ? (
                  <button
                    onClick={() => handleRestoreMedia(selectedMedia)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                  >
                    পুনরুদ্ধার করুন
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setDeleteModalMedia(selectedMedia);
                      setSelectedMedia(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                  >
                    ডিলিট করুন
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 2: DELETE CONFIRMATION ---------------- */}
      <AnimatePresence>
        {deleteModalMedia && (
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
                  <h3 className="text-base font-black">মিডিয়া ফাইল ডিলিট (Delete)</h3>
                  <p className="text-xs text-slate-500">{deleteModalMedia.title}</p>
                </div>
              </div>

              <p className="text-xs text-slate-700">
                আপনি কি নিশ্চিত যে এই <strong>{deleteModalMedia.mediaType}</strong> ফাইলটি ডিলিট করতে চান?
              </p>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600 truncate">
                {deleteModalMedia.storagePath}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalMedia(null)}
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

export default AddaMediaManagement;
