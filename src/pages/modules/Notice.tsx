import React, { useState, useEffect } from 'react';
import { copyToClipboard } from '../../utils/clipboard';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import ModulePageLayout from '../../components/common/ModulePageLayout';
import { 
  Bell, BellOff, X, Send, AlertCircle, CheckCircle2, Info, Pin, Clock, ShieldCheck, 
  Sparkles, Megaphone, Zap, Trash2, Edit, Smartphone, Settings, Volume2, VolumeX, Check, Search, Loader2, ChevronRight,
  Calendar, MapPin, Phone, Eye, ThumbsUp, Share2, Download, ChevronLeft, FileText, Heart, ArrowLeft,
  Landmark, GraduationCap, MessageCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { 
  collection, query, orderBy, onSnapshot, 
  addDoc, deleteDoc, doc, setDoc, serverTimestamp, updateDoc, increment
} from "firebase/firestore";
import { playNotificationChime } from '../../components/PushNotificationListener';
import { requestAndSaveFcmToken } from '../../services/fcmTokenService';
import Header from '../../components/home/Header';
import Footer from '../../components/home/Footer';
import BottomNavigation from '../../components/home/BottomNavigation';

const toBanglaNumber = (num: number | string) => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => {
    return banglaDigits[parseInt(digit)];
  });
};

const formatNoticeDate = (notice: any) => {
  if (notice.createdAt?.toDate) {
    return notice.createdAt.toDate().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (notice.createdAt) {
    const d = new Date(notice.createdAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }
  if (notice.date) {
    return notice.date;
  }
  return new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
};

const getNoticeDetails = (notice: any) => {
  const mainTitle = notice.title || notice.text || 'বিজ্ঞপ্তি';
  const mainDescription = notice.content || notice.description || notice.text || '';
  const category = notice.category || 'সাধারণ';
  
  return {
    category: category,
    title: mainTitle,
    description: mainDescription,
    image: notice.image || notice.imageUrl || null,
    eligibility: notice.eligibility && Array.isArray(notice.eligibility) && notice.eligibility.length > 0 ? notice.eligibility : null,
    deadline: notice.deadline || notice.endDate || null,
    location: notice.location || notice.venue || notice.address || null,
    phone: notice.phone || notice.contactPhone || notice.contactNumber || null,
    pdfUrl: notice.pdfUrl || notice.documentUrl || notice.pdf || null,
    pdfSize: notice.pdfSize || (notice.pdfUrl ? 'PDF File' : null),
    views: typeof notice.views === 'number' ? notice.views : 0,
    likes: typeof notice.likes === 'number' ? notice.likes : 0,
    hearts: typeof notice.hearts === 'number' ? notice.hearts : 0,
    formattedDate: formatNoticeDate(notice)
  };
};

const FALLBACK_NOTICES: NoticeItem[] = [
  {
    id: 'notice-1',
    text: 'পুঠিয়া উপজেলায় উন্নয়নের ধারা অব্যাহত রাখতে সবাইকে একসাথে কাজ করতে হবে।',
    category: 'জরুরি ঘোষণা',
    sender: 'উপজেলা প্রশাসন',
    severity: 'critical',
    color: '#ef4444',
    isActive: true,
    isPinned: true,
    order: 1,
    createdAt: { toDate: () => new Date() }
  },
  {
    id: 'notice-2',
    text: '৫ বছর বয়স পর্যন্ত শিশুদের পোলিও টিকাদান ক্যাম্পেইন চলছে। নিকটস্থ কেন্দ্রে টিকা দিন।',
    category: 'স্বাস্থ্য ক্যাম্পেইন',
    sender: 'উপজেলা স্বাস্থ্য কমপ্লেক্স',
    severity: 'warning',
    color: '#f59e0b',
    isActive: true,
    order: 2,
    createdAt: { toDate: () => new Date() }
  },
  {
    id: 'notice-3',
    text: 'কৃষি প্রণোদনা কর্মসূচির আওতায় কৃষকদের মাঝে বিনামূল্যে উন্নত জাতের বীজ ও সার বিতরণ শুরু।',
    category: 'কৃষি নোটিশ',
    sender: 'উপজেলা কৃষি অফিস',
    severity: 'info',
    color: '#3b82f6',
    isActive: true,
    order: 3,
    createdAt: { toDate: () => new Date(Date.now() - 86400000) }
  },
  {
    id: 'notice-4',
    text: 'পৌরসভার বিদ্যুৎ লাইন সংস্কার ও উন্নয়ন কাজের কারণে সাময়িক বিদ্যুৎ সরবরাহ বন্ধ সংক্রান্ত নোটিশ।',
    category: 'বিদ্যুৎ নোটিশ',
    sender: 'পৌরসভা বিদ্যুৎ অভিযোগ কেন্দ্র',
    severity: 'warning',
    color: '#f59e0b',
    isActive: true,
    order: 4,
    createdAt: { toDate: () => new Date(Date.now() - 172800000) }
  },
  {
    id: 'notice-5',
    text: 'পুঠিয়া উপজেলার মেধাবী শিক্ষার্থীদের জন্য বার্ষিক স্কলারশিপ আবেদন বিজ্ঞপ্তি প্রকাশ।',
    category: 'শিক্ষা নোটিশ',
    sender: 'উপজেলা শিক্ষা অফিস',
    severity: 'success',
    color: '#10b981',
    isActive: true,
    order: 5,
    createdAt: { toDate: () => new Date(Date.now() - 259200000) }
  },
  {
    id: 'notice-6',
    text: 'জরুরি অ্যাম্বুলেন্স, ফায়ার সার্ভিস ও থানা-পুলিশের জরুরি হটলাইন সার্বক্ষণিক উন্মুক্ত।',
    category: 'জরুরি সেবা',
    sender: 'জরুরি নিয়ন্ত্রণ কক্ষ',
    severity: 'critical',
    color: '#ef4444',
    isActive: true,
    order: 6,
    createdAt: { toDate: () => new Date(Date.now() - 345600000) }
  }
];

interface NoticeItem {
  id: string;
  text: string;
  color: string;
  isActive: boolean;
  isPinned?: boolean;
  order: number;
  createdAt?: any;
  category?: string;
  sender?: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
}

const Notice: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NoticeItem[]>(FALLBACK_NOTICES);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Notification Preferences State
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("puthia_notif_sound") !== "disabled";
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [activeNotification, setActiveNotification] = useState<NoticeItem | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  
  // Notice Reactions state
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [hearts, setHearts] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [userHearts, setUserHearts] = useState<Record<string, boolean>>({});

  // Custom categories subscription simulation
  const [subscriptions, setSubscriptions] = useState({
    electricity: true,
    health: true,
    disaster: true,
    govt: true,
    news: false
  });

  // Admin Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formText, setFormText] = useState("");
  const [formCategory, setFormCategory] = useState("সাধারণ ঘোষণা");
  const [formSender, setFormSender] = useState("উপজেলা প্রশাসন");
  const [formSeverity, setFormSeverity] = useState<NoticeItem['severity']>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStaff = user?.email === 'mdzosimuddin31@gmail.com' || 
                  userProfile?.role === 'admin' || 
                  userProfile?.role === 'super_admin' || 
                  userProfile?.role === 'staff';

  useEffect(() => {
    // Real-time listener for notices with graceful fallback to notice_items & FALLBACK_NOTICES
    const q = collection(db, "notices");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NoticeItem[];
      
      if (data.length === 0) {
        // Check notice_items as backup
        const qBackup = collection(db, "notice_items");
        const unsubBackup = onSnapshot(qBackup, (snap2) => {
          const data2 = snap2.docs.map(doc => {
            const d = doc.data();
            return { 
              id: doc.id, 
              text: d.text || d.title || '',
              category: d.category || 'সাধারণ ঘোষণা',
              sender: d.sender || 'উপজেলা প্রশাসন',
              severity: d.severity || (d.priority === 'high' ? 'critical' : 'info'),
              color: d.color || '#007A5E',
              isActive: d.isActive !== false,
              order: d.order || 1,
              createdAt: d.createdAt || new Date(),
              ...d 
            };
          }) as NoticeItem[];
          
          if (data2.length > 0) {
            setItems(data2);
          } else {
            setItems(FALLBACK_NOTICES);
          }
          setLoading(false);
        }, () => {
          setItems(FALLBACK_NOTICES);
          setLoading(false);
        });
      } else {
        setItems(data);
        setLoading(false);
      }
    }, (error) => {
      console.warn("Notice fetch error:", error);
      setItems(FALLBACK_NOTICES);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Restore user reaction states from localStorage
  useEffect(() => {
    const loadedLikes: Record<string, boolean> = {};
    const loadedHearts: Record<string, boolean> = {};
    items.forEach(item => {
      if (localStorage.getItem(`puthia_notice_like_${item.id}`) === 'true') {
        loadedLikes[item.id] = true;
      }
      if (localStorage.getItem(`puthia_notice_heart_${item.id}`) === 'true') {
        loadedHearts[item.id] = true;
      }
    });
    setUserLikes(loadedLikes);
    setUserHearts(loadedHearts);
  }, [items]);

  // Keep selectedNotice updated in real time when Firestore items update
  useEffect(() => {
    if (selectedNotice) {
      const updated = items.find(i => i.id === selectedNotice.id);
      if (updated) {
        setSelectedNotice(updated);
      }
    }
  }, [items]);

  // Handle selecting a notice and incrementing real view count in Firestore
  const handleSelectNotice = async (notice: NoticeItem) => {
    setSelectedNotice(notice);

    const sessionKey = `viewed_notice_${notice.id}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, 'true');
      try {
        const noticeRef = doc(db, "notices", notice.id);
        await updateDoc(noticeRef, {
          views: increment(1)
        });
      } catch (err) {
        try {
          const backupRef = doc(db, "notice_items", notice.id);
          await updateDoc(backupRef, {
            views: increment(1)
          });
        } catch (e) {
          console.log("Could not increment notice view count:", e);
        }
      }
    }
  };

  const handleLikeToggle = async (noticeId: string) => {
    const isLiked = userLikes[noticeId] ?? false;
    const newLiked = !isLiked;
    const delta = newLiked ? 1 : -1;

    setUserLikes(prev => ({ ...prev, [noticeId]: newLiked }));
    localStorage.setItem(`puthia_notice_like_${noticeId}`, newLiked ? 'true' : 'false');

    try {
      const noticeRef = doc(db, "notices", noticeId);
      await updateDoc(noticeRef, {
        likes: increment(delta)
      });
    } catch (err) {
      try {
        const backupRef = doc(db, "notice_items", noticeId);
        await updateDoc(backupRef, {
          likes: increment(delta)
        });
      } catch (e) {
        console.log("Could not update likes:", e);
      }
    }
  };

  const handleHeartToggle = async (noticeId: string) => {
    const isHearted = userHearts[noticeId] ?? false;
    const newHearted = !isHearted;
    const delta = newHearted ? 1 : -1;

    setUserHearts(prev => ({ ...prev, [noticeId]: newHearted }));
    localStorage.setItem(`puthia_notice_heart_${noticeId}`, newHearted ? 'true' : 'false');

    try {
      const noticeRef = doc(db, "notices", noticeId);
      await updateDoc(noticeRef, {
        hearts: increment(delta)
      });
    } catch (err) {
      try {
        const backupRef = doc(db, "notice_items", noticeId);
        await updateDoc(backupRef, {
          hearts: increment(delta)
        });
      } catch (e) {
        console.log("Could not update hearts:", e);
      }
    }
  };

  const handleIncomingNotice = (notice: NoticeItem) => {
    if (!notificationsEnabled) return;
    
    // Browser notification if permitted
    if (browserPermission === 'granted') {
      new Notification('আমাদের পুঠিয়া - নোটিশ', {
        body: notice.text,
        icon: '/logo.png'
      });
    }

    // Play chime if enabled
    if (soundEnabled) {
      playNotificationChime(notice.severity === 'critical' ? 'critical' : notice.severity === 'warning' ? 'warning' : 'info');
    }

    setActiveNotification(notice);
    // Auto-dismiss after 8 seconds
    setTimeout(() => setActiveNotification(null), 8000);
  };

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert('আপনার ব্রাউজার পুশ নোটিফিকেশন সমর্থন করে না।');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        requestAndSaveFcmToken(user?.uid).catch(err => console.warn('FCM registration error:', err));
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleToggleNotifications = () => {
    if (!notificationsEnabled) {
      if (browserPermission !== 'granted') {
        setShowPermissionPrompt(true);
      } else {
        setNotificationsEnabled(true);
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    localStorage.setItem("puthia_notif_sound", nextState ? "enabled" : "disabled");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formText.trim()) return;

    setIsSubmitting(true);
    try {
      const severityColors = {
        info: '#3b82f6',
        warning: '#f59e0b',
        critical: '#ef4444',
        success: '#10b981'
      };

      const data = {
        text: formText.trim(),
        category: formCategory,
        sender: formSender,
        severity: formSeverity,
        color: severityColors[formSeverity || 'info'],
        isActive: true,
        order: items.length + 1,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      };

      if (editingId) {
        await setDoc(doc(db, "notices", editingId), data, { merge: true });
      } else {
        await addDoc(collection(db, "notices"), {
          ...data,
          createdAt: serverTimestamp(),
          createdBy: user.uid
        });
      }

      resetForm();
    } catch (error) {
      handleFirestoreError(error as any, editingId ? OperationType.UPDATE : OperationType.CREATE, `notices/${editingId || ''}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await deleteDoc(doc(db, "notices", id));
    } catch (error) {
      handleFirestoreError(error as any, OperationType.DELETE, `notices/${id}`);
    }
  };

  const resetForm = () => {
    setFormText("");
    setFormCategory("সাধারণ ঘোষণা");
    setFormSender("উপজেলা প্রশাসন");
    setFormSeverity('info');
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (item: NoticeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormText(item.text);
    setFormCategory(item.category || "সাধারণ ঘোষণা");
    setFormSender(item.sender || "উপজেলা প্রশাসন");
    setFormSeverity(item.severity || 'info');
    setEditingId(item.id);
    setShowForm(true);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm.trim() || 
                          item.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.sender && item.sender.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = activeFilter === 'all' || 
                          item.severity === activeFilter ||
                          (activeFilter === 'critical' && (item.category?.includes('জরুরি') || item.category?.includes('গুরুত্বপূর্ণ'))) ||
                          (activeFilter === 'warning' && (item.category?.includes('সতর্ক') || item.category?.includes('বিদ্যুৎ') || item.category?.includes('স্বাস্থ্য'))) ||
                          (activeFilter === 'info' && (item.category?.includes('সাধারণ') || item.category?.includes('কৃষি'))) ||
                          (activeFilter === 'success' && (item.category?.includes('সাফল্য') || item.category?.includes('শিক্ষা')));
    return matchesSearch && matchesFilter;
  });

  const filterOptions = [
    { id: 'all', label: 'সবগুলো' },
    { id: 'critical', label: 'জরুরি' },
    { id: 'warning', label: 'সতর্কবার্তা' },
    { id: 'info', label: 'সাধারণ' },
    { id: 'success', label: 'সাফল্য' },
  ];

  const getSeverityStyles = (severity?: string) => {
    switch (severity) {
      case 'critical': return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: <AlertCircle className="w-5 h-5" /> };
      case 'warning': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: <Info className="w-5 h-5" /> };
      case 'success': return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: <CheckCircle2 className="w-5 h-5" /> };
      default: return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: <Megaphone className="w-5 h-5" /> };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <Header />
      <div className="flex-1 max-w-7xl mx-auto w-full pt-0 pb-32">
        <div className="animate-fade-in font-sans bg-gray-50 min-h-screen pb-20">
          {/* Header Banner */}
          <div 
            className="p-6 rounded-b-[32px] text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #065f46 0%, #047857 100%)' }}
          >
            <div className="flex items-center justify-between mb-6 min-h-[36px]">
              {showSearch ? (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl w-full">
                  <Search className="w-4 h-4 text-white shrink-0" />
                  <input
                    type="text"
                    placeholder="নোটিশ খুঁজুন..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent text-white placeholder-white/60 text-xs outline-none w-full"
                    autoFocus
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')} 
                      className="text-white/60 hover:text-white text-xs whitespace-nowrap cursor-pointer"
                    >
                      মুছুন
                    </button>
                  )}
                  <button 
                    onClick={() => { setShowSearch(false); setSearchTerm(''); }} 
                    className="text-white/85 hover:text-white text-xs font-bold pl-2 border-l border-white/20 whitespace-nowrap cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate('/')} 
                      className="p-1.5 hover:bg-white/10 rounded-full transition flex items-center justify-center cursor-pointer text-white mr-1"
                      aria-label="Back to Home"
                    >
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h2 className="text-lg font-bold">নোটিশ বোর্ড</h2>
                  </div>
                  <button 
                    onClick={() => setShowSearch(true)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition flex items-center justify-center cursor-pointer"
                    aria-label="Search Notices"
                  >
                    <Search className="w-5 h-5 text-white/80" />
                  </button>
                </>
              )}
            </div>
            
            <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white font-bold uppercase">গুরুত্বপূর্ণ তথ্য</span>
                <h3 className="text-lg font-bold mt-1">সকল নোটিশ ও ঘোষণা একসাথে</h3>
                <p className="text-[11px] opacity-80 mt-1">নিয়মিত আপডেট পেতে আমাদের সাথে থাকুন।</p>
              </div>
              <Megaphone className="w-12 h-12 text-white/40" />
            </div>
          </div>

          {/* Category Pills */}
          <div className="px-4 py-4 flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
            {filterOptions.map(cat => (
              <button 
                key={`notice-cat-${cat.id}`}
                type="button"
                onClick={() => setActiveFilter(cat.id)}
                className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-black transition-all border cursor-pointer active:scale-95 leading-normal ${
                  activeFilter === cat.id 
                    ? 'bg-[#006a4e] border-[#006a4e] text-white shadow-md' 
                    : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900 hover:bg-emerald-100/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Notice List */}
          <div className="px-4 pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-800">সর্বশেষ নোটিশ</h3>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" /></div>
              ) : filteredItems.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-2xs space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <h4 className="text-slate-800 font-black text-sm">এই ক্যাটাগরিতে কোনো নোটিশ পাওয়া যায়নি</h4>
                  <p className="text-slate-500 text-xs">সবগুলো নোটিশ দেখতে নিচের বাটনে চাপুন</p>
                  <button
                    type="button"
                    onClick={() => { setActiveFilter('all'); setSearchTerm(''); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006a4e] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer hover:bg-[#00543e] active:scale-95 transition"
                  >
                    <span>সকল নোটিশ দেখুন</span>
                  </button>
                </div>
              ) : (
                filteredItems.map((notice, index) => (
                <div 
                  key={notice.id} 
                  onClick={() => handleSelectNotice(notice)}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group cursor-pointer hover:border-emerald-200 transition active:scale-[0.99]"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">{notice.category}</span>
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-2">{notice.text}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                      <Clock className="w-3 h-3" /> {notice.createdAt?.toDate ? notice.createdAt.toDate().toLocaleDateString('bn-BD') : 'এখনই'}
                      {notice.sender && <span>• {notice.sender}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Modals and forms */}
        <AnimatePresence>
          {selectedNotice && (() => {
            const details = getNoticeDetails(selectedNotice);
            const isLiked = userLikes[selectedNotice.id] ?? false;
            const isHearted = userHearts[selectedNotice.id] ?? false;

            const handleShareClick = async () => {
              if (navigator.share) {
                navigator.share({
                  title: details.title,
                  text: details.description,
                  url: window.location.href,
                }).catch(err => console.log(err));
              } else {
                await copyToClipboard(window.location.href);
                alert('নোটিশের লিঙ্কটি কপি করা হয়েছে!');
              }
            };

            // Find related notices (same category or any other notices, excluding current one)
            const relatedNotices = items
              .filter(item => item.id !== selectedNotice.id)
              .slice(0, 2);

            return (
              <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed inset-0 z-[10008] bg-[#f8fafc] flex flex-col font-sans overflow-y-auto"
              >
                {/* Deep Green Header */}
                <div className="bg-[#005030] h-16 shrink-0 flex items-center justify-between px-4 text-white shadow-sm sticky top-0 z-50">
                  <button 
                    onClick={() => setSelectedNotice(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95 cursor-pointer"
                    id="btn-detail-back"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <span className="text-base font-black">নোটিশ বিস্তারিত</span>
                  <button 
                    onClick={handleShareClick}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95 cursor-pointer"
                    id="btn-detail-share"
                  >
                    <Share2 size={22} />
                  </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-4">
                  <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100/80 space-y-4">
                    
                    {/* Badge */}
                    <div>
                      <span className={`inline-block text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                        selectedNotice.severity === 'critical' ? 'bg-red-50 text-red-600 border border-red-100' :
                        selectedNotice.severity === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        selectedNotice.severity === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        'bg-emerald-50 text-emerald-800'
                      }`}>
                        {selectedNotice.severity === 'critical' ? 'গুরুত্বপূর্ণ' : details.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg sm:text-xl font-black text-slate-800 leading-snug">
                      {details.title}
                    </h2>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-300" />
                        প্রকাশের তারিখ: {details.formattedDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-slate-300" />
                        {toBanglaNumber(details.views)}
                      </span>
                    </div>

                    {/* Image - ONLY IF REAL IMAGE EXISTS AND IS NOT DEFAULT PLACEHOLDER */}
                    {details.image && (details.image.startsWith('http://') || details.image.startsWith('https://') || details.image.startsWith('data:')) && details.image !== '/logo.svg' && (
                      <div className="rounded-[20px] overflow-hidden bg-slate-100 aspect-video w-full border border-slate-100">
                        <img 
                          src={details.image} 
                          alt={details.title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.parentElement!.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Description */}
                    {details.description && (
                      <div className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed whitespace-pre-line bg-slate-50/80 p-4 rounded-2xl border border-slate-100/90 text-left">
                        {details.description}
                      </div>
                    )}

                    {/* Eligibility checklist - ONLY IF REAL ELIGIBILITY ARRAY EXISTS */}
                    {details.eligibility && Array.isArray(details.eligibility) && details.eligibility.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h3 className="text-xs sm:text-sm font-black text-slate-800">আবেদনের যোগ্যতা:</h3>
                        <div className="space-y-2">
                          {details.eligibility.map((eligibilityItem: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-bold">
                              <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle2 size={12} className="fill-emerald-50 stroke-emerald-600 stroke-[3px]" />
                              </div>
                              <span>{eligibilityItem}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Details Cards Container - ONLY IF AT LEAST ONE SPECIFIC FIELD EXISTS */}
                    {(details.deadline || details.location || details.phone) && (
                      <div className="border border-slate-100/90 rounded-[24px] overflow-hidden bg-slate-50/30 divide-y divide-slate-100/90">
                        {/* End Date */}
                        {details.deadline && (
                          <div className="flex items-center gap-3.5 p-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-400">শেষ তারিখ / সময়</p>
                              <p className="text-xs font-black text-slate-700">{details.deadline}</p>
                            </div>
                          </div>
                        )}

                        {/* Submission Location */}
                        {details.location && (
                          <div className="flex items-center gap-3.5 p-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <p className="text-[10px] font-bold text-slate-400">স্থান / ঠিকানা</p>
                              <p className="text-xs font-black text-slate-700 truncate">{details.location}</p>
                            </div>
                          </div>
                        )}

                        {/* Helpline / Contact */}
                        {details.phone && (
                          <div className="flex items-center gap-3.5 p-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <Phone className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-400">যোগাযোগের মোবাইল নম্বর</p>
                              <p className="text-xs font-black text-slate-700">{toBanglaNumber(details.phone)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PDF Box - ONLY IF PDF FILE IS ATTACHED */}
                    {details.pdfUrl && (
                      <a 
                        href={details.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-emerald-50/60 border border-emerald-100 rounded-[20px] group cursor-pointer hover:bg-emerald-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-sm border border-emerald-50">
                            <FileText className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800">বিজ্ঞপ্তি ডাউনলোড (PDF)</h4>
                            <p className="text-[10px] font-bold text-slate-400">{details.pdfSize || 'PDF File'}</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-50 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                          <Download className="w-4 h-4" />
                        </div>
                      </a>
                    )}

                    {/* Feedback/Reactions */}
                    <div className="pt-2 border-t border-slate-100/90 space-y-3">
                      <p className="text-xs font-black text-slate-400 text-center">এই নোটিশটি কেমন লাগলো?</p>
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => handleLikeToggle(selectedNotice.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-extrabold transition-all active:scale-95 cursor-pointer ${
                            isLiked 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' 
                              : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                          }`}
                          id="btn-like-notice"
                        >
                          <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-emerald-600' : ''}`} />
                          {toBanglaNumber(details.likes)}
                        </button>
                        <button 
                          onClick={() => handleHeartToggle(selectedNotice.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-extrabold transition-all active:scale-95 cursor-pointer ${
                            isHearted 
                              ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm' 
                              : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                          }`}
                          id="btn-heart-notice"
                        >
                          <Heart className={`w-4 h-4 ${isHearted ? 'fill-rose-600' : ''}`} />
                          {toBanglaNumber(details.hearts)}
                        </button>
                        <button 
                          onClick={handleShareClick}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-extrabold bg-white text-slate-500 border-slate-100 hover:border-slate-200 transition-all active:scale-95 cursor-pointer"
                          id="btn-inner-share-notice"
                        >
                          <Share2 className="w-4 h-4" />
                          শেয়ার
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Related Notices Section */}
                  {relatedNotices.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-black text-slate-800">সম্পর্কিত নোটিশ</h3>
                        <button 
                          onClick={() => setSelectedNotice(null)}
                          className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                          id="btn-view-all-notices"
                        >
                          সব দেখুন &rarr;
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {relatedNotices.map((relatedNoticeItem) => {
                          const itemDetails = getNoticeDetails(relatedNoticeItem);
                          const hasValidImage = itemDetails.image && (itemDetails.image.startsWith('http://') || itemDetails.image.startsWith('https://') || itemDetails.image.startsWith('data:'));

                          return (
                            <div 
                              key={relatedNoticeItem.id}
                              onClick={() => handleSelectNotice(relatedNoticeItem)}
                              className="bg-white p-3.5 rounded-[20px] shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:border-emerald-200 transition-all group"
                            >
                              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 overflow-hidden">
                                {hasValidImage ? (
                                  <img 
                                    src={itemDetails.image} 
                                    alt={relatedNoticeItem.text} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      if (e.currentTarget.parentElement) {
                                        e.currentTarget.parentElement.classList.add('flex', 'items-center', 'justify-center');
                                      }
                                    }}
                                  />
                                ) : (
                                  <Megaphone className="w-5 h-5 text-emerald-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <span className="text-[9px] font-extrabold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                                  {relatedNoticeItem.category || itemDetails.category}
                                </span>
                                <h4 className="text-xs font-black text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                                  {relatedNoticeItem.text}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-300" />
                                  {itemDetails.formattedDate}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })()}
          </AnimatePresence>

          <AnimatePresence>
            {activeNotification && (
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 20, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-24 left-4 right-4 md:left-auto md:right-8 md:w-[400px] z-[10005] bg-slate-900 text-white rounded-[32px] p-6 shadow-2xl border border-white/10"
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${activeNotification.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'}`}>
                    <Zap size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-black text-sm uppercase tracking-widest text-white/60">জরুরি নোটিফিকেশন</h4>
                      <button onClick={() => setActiveNotification(null)}>
                        <X size={18} className="text-white/40 hover:text-white" />
                      </button>
                    </div>
                    <p className="font-black text-base leading-tight mb-2">{activeNotification.text}</p>
                    <div className="text-[10px] font-bold text-white/40">{activeNotification.sender} থেকে</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showPermissionPrompt && (
              <div className="fixed inset-0 z-[10006] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-sm">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-[40px] w-full max-w-sm p-10 text-center shadow-2xl"
                >
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                    <Bell size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-4">নোটিফিকেশন অনুমতি</h2>
                  <p className="text-sm font-bold text-slate-400 mb-8 leading-relaxed">
                    আপনি কি পুঠিয়া নোটিশ বোর্ডের গুরুত্বপূর্ণ ও জরুরি নোটিফিকেশনগুলো সরাসরি আপনার ফোনে পেতে চান?
                  </p>
                  <div className="space-y-4">
                    <button
                      onClick={handleRequestPermission}
                      className="w-full py-5 bg-indigo-600 text-white rounded-[20px] font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-600/20"
                    >
                      হ্যাঁ, নোটিফিকেশন দিন
                    </button>
                    <button
                      onClick={() => setShowPermissionPrompt(false)}
                      className="w-full py-5 bg-slate-50 text-slate-600 rounded-[20px] font-black text-sm"
                    >
                      না, পরে দেখা যাবে
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showForm && (
              <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[48px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                  <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-[20px]">
                        <Megaphone size={28} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black">{editingId ? "নোটিশ আপডেট করুন" : "নতুন নোটিশ প্রকাশ করুন"}</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">অ্যাডমিন কন্ট্রোল</p>
                      </div>
                    </div>
                    <button onClick={resetForm} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                      <X size={28} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">নোটিশের বিষয়/ক্যাটাগরি</label>
                        <input
                          required
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-8 py-5 bg-gray-50 border-none rounded-3xl font-black text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          placeholder="যেমন: বিদ্যুৎ বিভ্রাট, টিকা ক্যাম্পেইন"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">প্রেরক/বিভাগ</label>
                          <input
                            required
                            value={formSender}
                            onChange={(e) => setFormSender(e.target.value)}
                            className="w-full px-8 py-5 bg-gray-50 border-none rounded-3xl font-black text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">গুরুত্ব</label>
                          <select
                            value={formSeverity}
                            onChange={(e) => setFormSeverity(e.target.value as any)}
                            className="w-full px-8 py-5 bg-gray-50 border-none rounded-3xl font-black text-sm appearance-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          >
                            <option value="info">সাধারণ</option>
                            <option value="warning">সতর্কবার্তা</option>
                            <option value="critical">জরুরি</option>
                            <option value="success">সাফল্য</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">নোটিশের বর্ণনা</label>
                        <textarea
                          required
                          value={formText}
                          onChange={(e) => setFormText(e.target.value)}
                          rows={5}
                          className="w-full px-8 py-5 bg-gray-50 border-none rounded-3xl font-black text-sm resize-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-lg flex items-center justify-center gap-4 shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 disabled:bg-slate-300"
                    >
                      {isSubmitting ? "প্রকাশ করা হচ্ছে..." : (editingId ? "নোটিশ আপডেট করুন" : "নোটিশ পাবলিশ করুন")}
                      <Sparkles size={24} />
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <Footer />
      <BottomNavigation activeTab="services" onTabChange={() => {}} />
    </div>
  );
};

export default Notice;

