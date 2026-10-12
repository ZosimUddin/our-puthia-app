import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, Users, Store, DollarSign, Database, 
  Activity, Settings, Lock, Sparkles, RefreshCw, 
  ArrowUpRight, Bell, CheckCircle2, AlertCircle, 
  ShieldAlert, KeyRound, Stethoscope, Heart, Newspaper, 
  Droplets, Clock, FileCheck, AlertTriangle, Star, 
  CheckSquare, BarChart3, Search, ExternalLink, Package, 
  Home, Building2, GraduationCap, Sprout, Briefcase, 
  FileText, Calendar, ImageIcon, Megaphone, Menu, Filter, 
  TrendingUp, Zap, UserCheck, Shield, ChevronRight, Eye, 
  Check, X, ShieldX, Terminal, History, ArrowRight, Sliders, 
  Plus, CheckCheck, HelpCircle, LayoutDashboard, MessageSquare,
  Flame, Smartphone, Video, Globe, HardDrive, PhoneCall
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  collection, getDocs, onSnapshot, query, 
  orderBy, limit as firestoreLimit, doc, getDoc, setDoc, updateDoc
} from "firebase/firestore";
import { db } from "../../firebase";
import { subscribeToActivePresences } from "../../services/presenceService";
import { DEFAULT_64_SERVICES_GRID } from "../../services/servicesGridService";
import { toast } from "sonner";

// Helper to format number to Bengali numerals
const toBengaliNumber = (num: number | string): string => {
  if (num === undefined || num === null) return "০";
  return String(num).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
};

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, user } = useAuth();
  
  // Master 2-Wing Architecture: 'main' (Main Portal) vs 'adda' (Adda Social)
  const [activeWing, setActiveWing] = useState<"main" | "adda">("main");
  const [loading, setLoading] = useState(true);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // Real-Time Dynamic Counts for ALL REAL main site and adda collections
  const [stats, setStats] = useState({
    // Online
    onlineUsers: 1,
    // Main Site
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    adminTeamCount: 0,
    bannersCount: 0,
    noticesCount: 0,
    servicesCount: DEFAULT_64_SERVICES_GRID.filter(s => s.enabled).length, // 52 live services on homepage
    doctorsCount: 0,
    hospitalsCount: 0,
    bloodDonorsCount: 0,
    shopsCount: 0,
    pendingShopsCount: 0,
    rentalsCount: 0,
    newsCount: 0,
    jobsCount: 0,
    agriCount: 0,
    adsCount: 0,
    
    // Adda Social
    postsCount: 0,
    commentsCount: 0,
    storiesCount: 0,
    reportsCount: 0,
    bannedAddaUsers: 0,
    pendingWithdrawals: 0,
    totalRevenue: 24500
  });

  // Pending items for quick review
  const [pendingShops, setPendingShops] = useState<any[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<any[]>([]);

  // 1. Live Subscriptions from Firestore
  useEffect(() => {
    setLoading(true);
    const unsubs: (() => void)[] = [];

    // Online Presences
    try {
      const unsubPresences = subscribeToActivePresences((presences) => {
        setStats(prev => ({ ...prev, onlineUsers: Math.max(1, presences.length) }));
      });
      unsubs.push(unsubPresences);
    } catch (_) {}

    // Users Collection
    try {
      const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        let total = snap.size;
        let active = 0;
        let banned = 0;
        let staff = 0;
        snap.forEach(d => {
          const data = d.data();
          if (data.status === 'banned' || data.isBlocked) banned++;
          else active++;
          if (data.role && data.role !== 'user') staff++;
        });
        setStats(prev => ({
          ...prev,
          totalUsers: total,
          activeUsers: active,
          bannedUsers: banned,
          adminTeamCount: staff
        }));
      });
      unsubs.push(unsubUsers);
    } catch (_) {}

    // Banners Collection
    try {
      const unsubBanners = onSnapshot(collection(db, "banners"), (snap) => {
        setStats(prev => ({ ...prev, bannersCount: snap.size }));
      });
      unsubs.push(unsubBanners);
    } catch (_) {}

    // Notices Collection
    try {
      const unsubNotices = onSnapshot(collection(db, "notices"), (snap) => {
        setStats(prev => ({ ...prev, noticesCount: snap.size }));
      });
      unsubs.push(unsubNotices);
    } catch (_) {}

    // Health Services (Doctors & Hospitals)
    try {
      const unsubHealth = onSnapshot(collection(db, "health_services"), (snap) => {
        let docs = 0;
        let hosps = 0;
        snap.forEach(d => {
          const data = d.data();
          if (data.category === 'doctors' || data.type === 'doctor') docs++;
          else hosps++;
        });
        setStats(prev => ({ 
          ...prev, 
          doctorsCount: docs, 
          hospitalsCount: hosps 
        }));
      });
      unsubs.push(unsubHealth);
    } catch (_) {}

    // Blood Donors
    try {
      const unsubBlood = onSnapshot(collection(db, "blood_donors"), (snap) => {
        setStats(prev => ({ ...prev, bloodDonorsCount: snap.size }));
      });
      unsubs.push(unsubBlood);
    } catch (_) {}

    // Local Shops / Businesses
    try {
      const unsubShops = onSnapshot(collection(db, "local_shops"), (snap) => {
        const pShops: any[] = [];
        let total = snap.size;
        snap.forEach(d => {
          const data = d.data();
          if (data.verified === false || data.status === 'pending') {
            pShops.push({ id: d.id, ...data });
          }
        });
        setPendingShops(pShops);
        setStats(prev => ({ 
          ...prev, 
          shopsCount: total, 
          pendingShopsCount: pShops.length 
        }));
      });
      unsubs.push(unsubShops);
    } catch (_) {}

    // House Rent / To-Let
    try {
      const unsubRent = onSnapshot(collection(db, "house_rent"), (snap) => {
        setStats(prev => ({ ...prev, rentalsCount: snap.size }));
      });
      unsubs.push(unsubRent);
    } catch (_) {}

    // News
    try {
      const unsubNews = onSnapshot(collection(db, "news"), (snap) => {
        setStats(prev => ({ ...prev, newsCount: snap.size }));
      });
      unsubs.push(unsubNews);
    } catch (_) {}

    // Jobs
    try {
      const unsubJobs = onSnapshot(collection(db, "jobs"), (snap) => {
        setStats(prev => ({ ...prev, jobsCount: snap.size }));
      });
      unsubs.push(unsubJobs);
    } catch (_) {}

    // Adda: Posts (Listen to 'posts' and 'discussions')
    try {
      let p1 = 0;
      let p2 = 0;
      const unsubPosts = onSnapshot(collection(db, "posts"), (snap) => {
        p1 = snap.size;
        setStats(prev => ({ ...prev, postsCount: Math.max(p1, p2) }));
      });
      unsubs.push(unsubPosts);

      const unsubDiscussions = onSnapshot(collection(db, "discussions"), (snap) => {
        p2 = snap.size;
        setStats(prev => ({ ...prev, postsCount: Math.max(p1, p2) }));
      });
      unsubs.push(unsubDiscussions);
    } catch (_) {}

    // Adda: Comments
    try {
      const unsubComments = onSnapshot(collection(db, "comments"), (snap) => {
        setStats(prev => ({ ...prev, commentsCount: snap.size }));
      });
      unsubs.push(unsubComments);
    } catch (_) {}

    // Adda: Stories
    try {
      const unsubStories = onSnapshot(collection(db, "stories"), (snap) => {
        setStats(prev => ({ ...prev, storiesCount: snap.size }));
      });
      unsubs.push(unsubStories);
    } catch (_) {}

    // Adda: Reports
    try {
      const unsubReports = onSnapshot(collection(db, "reports"), (snap) => {
        setStats(prev => ({ ...prev, reportsCount: snap.size }));
      });
      unsubs.push(unsubReports);
    } catch (_) {}

    // Audit Logs
    try {
      const unsubLogs = onSnapshot(
        query(collection(db, "admin_audit_logs"), orderBy("timestamp", "desc"), firestoreLimit(6)),
        (snap) => {
          const loadedLogs: any[] = [];
          snap.forEach(d => loadedLogs.push({ id: d.id, ...d.data() }));
          setRecentAuditLogs(loadedLogs);
        }
      );
      unsubs.push(unsubLogs);
    } catch (_) {}

    setLoading(false);
    return () => unsubs.forEach(fn => fn());
  }, []);

  // Quick Approve Shop
  const handleApproveShop = async (shopId: string, shopName: string) => {
    setActiveActionId(shopId);
    try {
      await updateDoc(doc(db, "local_shops", shopId), {
        verified: true,
        status: "active",
        approvedAt: new Date().toISOString(),
        approvedBy: userProfile?.name || "Super Admin"
      });
      toast.success(`"${shopName}" সফলভাবে অনুমোদন ও ভেরিফাই করা হয়েছে`);
    } catch (err) {
      toast.error("অনুমোদনে সমস্যা হয়েছে");
    } finally {
      setActiveActionId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* 1. Master Top Hero Banner with 2-Wing Switcher in Signature Green */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B7A3B] via-[#01412F] to-[#042A1E] border border-emerald-500/40 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/15">
        {/* Subtle decorative glow circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-300/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 text-white border border-white/30 backdrop-blur-xs flex items-center gap-1.5 shadow-2xs">
                <CrownIcon />
                <span>সুপার অ্যাডমিন কমান্ড সেন্টার</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-400/30">
                🟢 রিয়েল-টাইম সিঙ্ক
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{activeWing === 'main' ? '🌐 মেইন পোর্টাল ও নাগরিক সেবা কন্ট্রোল' : '💬 আড্ডা সোশ্যাল ও কমিউনিটি হাব কন্ট্রোল'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl font-medium">
              {activeWing === 'main' 
                ? 'হোমপেজ ব্যানার, ৫২টি নাগরিক সেবা, ডাক্তার, রক্তদাতা, ব্যবসা ও টু-লেট সহ মূল সাইটের সকল লাইভ ডাটা পরিচালনা করুন।'
                : 'নাগরিক আড্ডা পোস্ট, কমেন্ট, স্টোরিজ, রিপোর্ট ও ট্রাস্ট-সেফটি কন্ট্রোল করুন।'
              }
            </p>
          </div>

          {/* Master 2-Wing Toggle Pill in Green Theme */}
          <div className="flex items-center gap-1.5 p-1.5 bg-emerald-950/70 backdrop-blur-md rounded-2xl border border-emerald-400/30 shrink-0">
            <button
              type="button"
              onClick={() => setActiveWing('main')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeWing === 'main'
                  ? 'bg-white text-[#0B7A3B] shadow-md shadow-black/20'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Globe size={15} />
              <span>🌐 মেইন সাইট</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveWing('adda')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeWing === 'adda'
                  ? 'bg-emerald-400 text-slate-950 shadow-md font-black shadow-black/20'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare size={15} />
              <span>💬 আড্ডা সোশ্যাল</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME VITAL KPI STATS */}
      {activeWing === 'main' ? (
        /* WING 1: MAIN SITE REAL STATS */
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Live Users */}
          <div 
            onClick={() => navigate('/admin/realtime-users')}
            className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:border-[#0B7A3B] hover:shadow-sm cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-[#0B7A3B] mb-1">
              <span className="text-xs font-black">লাইভ অনলাইন</span>
              <span className="w-2 h-2 rounded-full bg-[#0B7A3B] animate-pulse"></span>
            </div>
            <p className="text-2xl font-black text-slate-900">{toBengaliNumber(stats.onlineUsers)} জন</p>
            <p className="text-[10px] text-[#0B7A3B] font-bold mt-1 group-hover:underline">রিয়েল-টাইম ট্র্যাকার ➔</p>
          </div>

          {/* Registered Citizens */}
          <div 
            onClick={() => navigate('/admin/users')}
            className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:border-[#0B7A3B] hover:shadow-sm cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-black">মোট ইউজার</span>
              <Users size={15} className="text-[#0B7A3B]" />
            </div>
            <p className="text-2xl font-black text-slate-900">{toBengaliNumber(stats.totalUsers)}</p>
            <p className="text-[10px] text-[#0B7A3B] font-bold mt-1">{toBengaliNumber(stats.activeUsers)} সক্রিয়</p>
          </div>

          {/* 52 Live Services on Homepage */}
          <div 
            onClick={() => navigate('/admin/63-services')}
            className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:border-[#0B7A3B] hover:shadow-sm cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-[#0B7A3B] mb-1">
              <span className="text-xs font-black">নাগরিক সেবা</span>
              <Sparkles size={15} className="text-[#0B7A3B]" />
            </div>
            <p className="text-2xl font-black text-slate-900">{toBengaliNumber(stats.servicesCount)}টি সেবা</p>
            <p className="text-[10px] text-[#0B7A3B] font-bold mt-1 group-hover:underline">হোমপেজ গ্রিড ➔</p>
          </div>

          {/* Doctors Directory */}
          <div 
            onClick={() => navigate('/admin/health')}
            className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:border-[#0B7A3B] hover:shadow-sm cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-rose-600 mb-1">
              <span className="text-xs font-black">ডাক্তার সূচি</span>
              <Stethoscope size={15} />
            </div>
            <p className="text-2xl font-black text-slate-900">{toBengaliNumber(stats.doctorsCount)} জন</p>
            <p className="text-[10px] text-slate-500 font-bold mt-1 group-hover:underline">চেম্বার ও শিডিউল ➔</p>
          </div>

          {/* Blood Donors */}
          <div 
            onClick={() => navigate('/admin/blood-donors')}
            className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:border-[#0B7A3B] hover:shadow-sm cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-red-600 mb-1">
              <span className="text-xs font-black">রক্তদাতা</span>
              <Droplets size={15} />
            </div>
            <p className="text-2xl font-black text-slate-900">{toBengaliNumber(stats.bloodDonorsCount)} জন</p>
            <p className="text-[10px] text-slate-500 font-bold mt-1 group-hover:underline">রক্তের গ্রুপ তালিকা ➔</p>
          </div>

          {/* Local Shops & Pending */}
          <div 
            onClick={() => navigate('/admin/businesses')}
            className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:border-[#0B7A3B] hover:shadow-sm cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-xs font-black">ব্যবসা প্রতিষ্ঠান</span>
              <Store size={15} />
            </div>
            <p className="text-2xl font-black text-slate-900">{toBengaliNumber(stats.shopsCount)}টি</p>
            <p className="text-[10px] text-amber-700 font-bold mt-1">
              {stats.pendingShopsCount > 0 ? `🟡 ${toBengaliNumber(stats.pendingShopsCount)}টি পেন্ডিং` : 'সব ভেরিফাইড'}
            </p>
          </div>
        </div>
      ) : (
        /* WING 2: ADDA SOCIAL REAL STATS */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Adda Posts */}
          <div 
            onClick={() => navigate('/admin/moderation?tab=posts')}
            className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:border-[#0B7A3B] hover:shadow-sm cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-[#0B7A3B] mb-1">
              <span className="text-xs font-black">নাগরিক আড্ডা পোস্ট</span>
              <MessageSquare size={15} />
            </div>
            <p className="text-2xl font-black text-slate-900">{toBengaliNumber(stats.postsCount)}</p>
            <p className="text-[10px] text-slate-500 font-bold mt-1 group-hover:underline">পোস্ট মডারেশন ➔</p>
          </div>

          {/* Comments */}
          <div 
            onClick={() => navigate('/admin/moderation?tab=comments')}
            className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:border-[#0B7A3B] hover:shadow-sm cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-blue-600 mb-1">
              <span className="text-xs font-black">মোট মন্তব্য</span>
              <MessageSquare size={15} />
            </div>
            <p className="text-2xl font-black text-slate-900">{toBengaliNumber(stats.commentsCount)}</p>
            <p className="text-[10px] text-slate-500 font-bold mt-1 group-hover:underline">কমেন্ট রিভিউ ➔</p>
          </div>

          {/* Stories */}
          <div 
            onClick={() => navigate('/admin/moderation?tab=stories')}
            className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:border-[#0B7A3B] hover:shadow-sm cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-rose-600 mb-1">
              <span className="text-xs font-black">লাইভ স্টোরিজ ও রিলস</span>
              <Video size={15} />
            </div>
            <p className="text-2xl font-black text-slate-900">{toBengaliNumber(stats.storiesCount)}</p>
            <p className="text-[10px] text-slate-500 font-bold mt-1 group-hover:underline">২৪ ঘণ্টার স্টোরি ➔</p>
          </div>

          {/* Reports & Safety */}
          <div 
            onClick={() => navigate('/admin/moderation?tab=reports')}
            className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:border-[#0B7A3B] hover:shadow-sm cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-xs font-black">নাগরিক রিপোর্ট</span>
              <AlertCircle size={15} />
            </div>
            <p className="text-2xl font-black text-slate-900">{toBengaliNumber(stats.reportsCount)}</p>
            <p className="text-[10px] text-amber-700 font-bold mt-1">ফ্ল্যাগড রিপোর্টস ➔</p>
          </div>
        </div>
      )}

      {/* 3. CORE MANAGEMENT MODULES (Only what exists on Main Site & Adda) */}
      <div className="bg-white rounded-3xl border border-emerald-100 p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0B7A3B]"></span>
            <span>{activeWing === 'main' ? 'মেইন সাইট ম্যানেজমেন্ট মডিউলসমূহ' : 'আড্ডা সোশ্যাল মডারেশন মডিউলসমূহ'}</span>
          </h2>
          <span className="text-xs font-bold text-[#0B7A3B] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ১-ক্লিক ডিরেক্ট কন্ট্রোল
          </span>
        </div>

        {activeWing === 'main' ? (
          /* Main Site Real Modules Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { name: "হিরো ব্যানার স্লাইডার", count: `${toBengaliNumber(stats.bannersCount)} ব্যানার`, icon: Sliders, path: "/admin/banners", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              { name: "জরুরি নোটিশ বোর্ড", count: `${toBengaliNumber(stats.noticesCount)} নোটিশ`, icon: Bell, path: "/admin/notices", color: "text-rose-700 bg-rose-50 border-rose-200" },
              { name: "নাগরিক সেবা (৫২টি সেবা)", count: `${toBengaliNumber(stats.servicesCount)} সেবা`, icon: Sparkles, path: "/admin/63-services", color: "text-teal-700 bg-teal-50 border-teal-200" },
              { name: "নাগরিক ইউজার ও রোলস", count: `${toBengaliNumber(stats.totalUsers)} ইউজার`, icon: Users, path: "/admin/users", color: "text-blue-700 bg-blue-50 border-blue-200" },
              { name: "ডাক্তার ও হাসপাতাল সূচি", count: `${toBengaliNumber(stats.doctorsCount)} ডাক্তার`, icon: Heart, path: "/admin/health", color: "text-red-700 bg-red-50 border-red-200" },
              { name: "রক্তদাতা নেটওয়ার্ক", count: `${toBengaliNumber(stats.bloodDonorsCount)} ডোনার`, icon: Droplets, path: "/admin/blood-donors", color: "text-rose-700 bg-rose-50 border-rose-200" },
              { name: "ব্যবসা ও শপ অনুমোদন", count: `${toBengaliNumber(stats.shopsCount)} প্রতিষ্ঠান`, icon: Store, path: "/admin/businesses", color: "text-amber-700 bg-amber-50 border-amber-200" },
              { name: "বাসা-ভাড়া ও টু-লেট", count: `${toBengaliNumber(stats.rentalsCount)} টু-লেট`, icon: Home, path: "/admin/house-rent", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
              { name: "সংবাদ ও পুঠিয়া খবর", count: `${toBengaliNumber(stats.newsCount)} সংবাদ`, icon: Newspaper, path: "/admin/news", color: "text-sky-700 bg-sky-50 border-sky-200" },
              { name: "চাকরির বিজ্ঞপ্তি", count: `${toBengaliNumber(stats.jobsCount)} সার্কুলার`, icon: Briefcase, path: "/admin/jobs", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              { name: "কৃষি তথ্য ও বাজারদর", count: "বাজারদর", icon: Sprout, path: "/admin/agriculture", color: "text-lime-700 bg-lime-50 border-lime-200" },
              { name: "সাইট সেটিংস ও অডিট", count: "সিস্টেম", icon: Settings, path: "/admin/settings", color: "text-slate-700 bg-slate-100 border-slate-200" },
            ].map((mod) => (
              <div
                key={mod.name}
                onClick={() => navigate(mod.path)}
                className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-400 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${mod.color}`}>
                    <mod.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                      {mod.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{mod.count}</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-300 group-hover:text-emerald-600 shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          /* Adda Social Real Modules Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { name: "রিপোর্ট ও মডারেশন হাব ⭐", count: "৬-ধাপ অ্যাকশন", icon: ShieldAlert, path: "/admin/reports-moderation", color: "text-rose-700 bg-rose-50 border-rose-200" },
              { name: "🔴 LOCK DOWN ADDA", count: "ইমার্জেন্সি লকডাউন", icon: Lock, path: "/admin/emergency-moderation", color: "text-rose-800 bg-rose-100 border-rose-300" },
              { name: "⚙️ আড্ডা সিস্টেম সেটিংস", count: "১৩টি মডিউল কনফিগ", icon: Settings, path: "/admin/adda-settings", color: "text-[#0B7A3B] bg-emerald-50 border-emerald-200" },
              { name: "আড্ডা পোস্ট ম্যানেজমেন্ট", count: `${toBengaliNumber(stats.postsCount)} পোস্ট`, icon: FileText, path: "/admin/adda-posts", color: "text-purple-700 bg-purple-50 border-purple-200" },
              { name: "আড্ডা কমেন্ট ম্যানেজমেন্ট", count: `${toBengaliNumber(stats.commentsCount)} মন্তব্য`, icon: MessageSquare, path: "/admin/adda-comments", color: "text-blue-700 bg-blue-50 border-blue-200" },
              { name: "আড্ডা মিডিয়া ম্যানেজমেন্ট", count: "ফটো/ভিডিও/রিলস", icon: HardDrive, path: "/admin/adda-media", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              { name: "মেসেঞ্জার কন্ট্রোল ও সেফটি", count: "প্রাইভেসি সেফটি", icon: Lock, path: "/admin/adda-messenger", color: "text-rose-700 bg-rose-50 border-rose-200" },
              { name: "কল ম্যানেজমেন্ট ও সেফটি", count: "অডিও/ভিডিও রিপোর্ট", icon: PhoneCall, path: "/admin/adda-calls", color: "text-amber-700 bg-amber-50 border-amber-200" },
              { name: "ফ্রেন্ডস ও ফলো কন্ট্রোল", count: "সোশাল গ্রাফ", icon: UserCheck, path: "/admin/adda-friends", color: "text-teal-700 bg-teal-50 border-teal-200" },
              { name: "আড্ডা ইউজার ম্যানেজমেন্ট", count: "সকল ইউজার", icon: Users, path: "/admin/adda-users", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
              { name: "লাইভ স্টোরিজ ও রিলস", count: `${toBengaliNumber(stats.storiesCount)} স্টোরি`, icon: Video, path: "/admin/adda-media?tab=reel", color: "text-rose-700 bg-rose-50 border-rose-200" },
              { name: "ইউজার রিপোর্ট ও কমপ্লেন", count: `${toBengaliNumber(stats.reportsCount)} রিপোর্ট`, icon: AlertCircle, path: "/admin/reports-moderation?cat=user", color: "text-amber-700 bg-amber-50 border-amber-200" },
              { name: "স্প্যাম ও অ্যান্টি-স্প্যাম", count: "ট্রাস্ট সেফটি", icon: ShieldCheck, path: "/admin/trust-safety", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              { name: "ব্যানড ও মিউটেড ইউজার", count: "রেস্ট্রিক্টেড", icon: Lock, path: "/admin/adda-users?tab=banned", color: "text-rose-700 bg-rose-50 border-rose-200" },
              { name: "মনিটাইজেশন ও ওয়ালেট", count: "আর্নিং", icon: DollarSign, path: "/admin/monetization", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
            ].map((mod) => (
              <div
                key={mod.name}
                onClick={() => navigate(mod.path)}
                className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-purple-400 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${mod.color}`}>
                    <mod.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate group-hover:text-purple-700 transition-colors">
                      {mod.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{mod.count}</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-300 group-hover:text-purple-600 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. PENDING VERIFICATIONS & RECENT AUDIT LOGS (Wing Specific) */}
      {activeWing === 'main' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pending Shops / Merchant Verifications */}
          <div className="bg-white rounded-3xl border border-emerald-100 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Store size={16} className="text-amber-600" />
                <span>ব্যবসা ও প্রতিষ্ঠান যাচাইকরণ তালিকা</span>
              </h3>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {toBengaliNumber(pendingShops.length)}টি পেন্ডিং
              </span>
            </div>

            {pendingShops.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-1.5 opacity-80" />
                <p className="text-xs font-bold text-slate-700">কোনো পেন্ডিং ব্যবসা প্রতিষ্ঠান নেই</p>
                <p className="text-[11px] text-slate-400">সকল ব্যবসা সফলভাবে ভেরিফাইড রয়েছে</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingShops.map((shop) => (
                  <div key={shop.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{shop.name || "নতুন শপ"}</p>
                      <p className="text-[11px] text-slate-500">{shop.owner || shop.phone || "নাগরিক আবেদন"}</p>
                    </div>
                    <button
                      onClick={() => handleApproveShop(shop.id, shop.name || "শপ")}
                      disabled={activeActionId === shop.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs shrink-0"
                    >
                      {activeActionId === shop.id ? "অনুমোদন হচ্ছে..." : "✓ ভেরিফাই করুন"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Admin Audit Log Stream */}
          <div className="bg-white rounded-3xl border border-emerald-100 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <History size={16} className="text-[#0B7A3B]" />
                <span>লাইভ অ্যাডমিন অডিট ট্রেইল (Audit Log)</span>
              </h3>
              <button 
                onClick={() => navigate('/admin/audit-logs')}
                className="text-[11px] font-bold text-[#0B7A3B] hover:underline cursor-pointer"
              >
                সবগুলো দেখুন ➔
              </button>
            </div>

            {recentAuditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <ShieldCheck size={32} className="mx-auto text-slate-300 mb-1.5" />
                <p className="text-xs font-bold text-slate-600">কোনো অডিট লগ রেকর্ড নেই</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAuditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 bg-emerald-50/30 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{log.action || log.reason || "অ্যাডমিন অ্যাকশন"}</p>
                      <p className="text-[10px] text-slate-400">{log.actorName || "সুপার অ্যাডমিন"} • {log.targetType || "সিস্টেম"}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-[#0B7A3B] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      লাইভ
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ADDA SOCIAL SPECIFIC WIDGETS */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Adda Flagged & Reported Posts Queue */}
          <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600" />
                <span>আড্ডা ফ্ল্যাগড রিপোর্ট ও কমপ্লেন কিউ</span>
              </h3>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                {toBengaliNumber(stats.reportsCount)}টি রিপোর্ট
              </span>
            </div>

            {stats.reportsCount === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 size={32} className="mx-auto text-purple-500 mb-1.5 opacity-80" />
                <p className="text-xs font-bold text-slate-700">কোনো পেন্ডিং আড্ডা রিপোর্ট নেই</p>
                <p className="text-[11px] text-slate-400">সকল নাগরিক পোস্ট ও কমেন্ট নিরাপদ ও স্প্যামমুক্ত</p>
              </div>
            ) : (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">{toBengaliNumber(stats.reportsCount)}টি আড্ডা কন্টেন্ট ইউজারদের দ্বারা ফ্ল্যাগ করা হয়েছে</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">মডারেশন সেন্টার থেকে দ্রুত পোস্ট রিভিউ অথবা ডিলিট করুন</p>
                </div>
                <button
                  onClick={() => navigate('/admin/moderation?tab=reports')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-xs"
                >
                  রিপোর্ট মডারেশন সেন্টারে যান ➔
                </button>
              </div>
            )}
          </div>

          {/* Adda Trust & Safety Actions */}
          <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-purple-600" />
                <span>আড্ডা ট্রাস্ট ও সেফটি কন্ট্রোল হাব</span>
              </h3>
              <button 
                onClick={() => navigate('/admin/trust-safety')}
                className="text-[11px] font-bold text-purple-600 hover:underline cursor-pointer"
              >
                রুলস পরিচালনা ➔
              </button>
            </div>

            <div className="space-y-2.5">
              <div 
                onClick={() => navigate('/admin/moderation?tab=posts')}
                className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 hover:border-purple-300 hover:bg-white transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={16} className="text-purple-600" />
                  <span className="text-xs font-bold text-slate-800">সর্বমোট সক্রিয় আড্ডা পোস্ট</span>
                </div>
                <span className="text-xs font-black text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  {toBengaliNumber(stats.postsCount)} পোস্ট
                </span>
              </div>

              <div 
                onClick={() => navigate('/admin/moderation?tab=banned')}
                className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 hover:border-rose-300 hover:bg-white transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Lock size={16} className="text-rose-600" />
                  <span className="text-xs font-bold text-slate-800">ব্যানড ও রেস্ট্রিক্টেড অ্যাকাউন্টস</span>
                </div>
                <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                  রেস্ট্রিকশন লিস্ট ➔
                </span>
              </div>

              <div 
                onClick={() => navigate('/admin/monetization')}
                className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:border-emerald-300 hover:bg-white transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign size={16} className="text-[#0B7A3B]" />
                  <span className="text-xs font-bold text-slate-800">নাগরিক মনিটাইজেশন ও ওয়ালেট</span>
                </div>
                <span className="text-xs font-black text-[#0B7A3B] bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  পেমেন্ট হাব ➔
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Crown SVG Icon Helper
const CrownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

export default SuperAdminDashboard;
