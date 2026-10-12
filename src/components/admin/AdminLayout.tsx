import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, LayoutDashboard, Users, Store, Package, Home, 
  Bell, Newspaper, Calendar, Image as ImageIcon, 
  Megaphone, Settings, LogOut, Menu, X,
  Droplets, FileText, Building2, Heart, User, Pencil, Lock, Globe, HelpCircle, 
  ShieldCheck, ShieldAlert, DollarSign, Sparkles, Trophy, Landmark,
  Activity, Shield, CheckCircle2, ChevronDown, ChevronRight, Eye, Key,
  Phone, PhoneCall, Share2, Search, Wrench, Clock, AlertCircle, AlertTriangle, FileCheck, CheckSquare,
  Tag, ShoppingBag, Truck, MapPin, Stethoscope, GraduationCap, Sprout, Briefcase,
  Video, FolderKanban, Sliders, Layers, UserCheck, UserX, UserPlus, BarChart2, MessageSquare, Flame, Smartphone,
  Database, HardDrive, UploadCloud, Wifi, Mic, SearchCode, History, Info, Headphones, Star, Download
} from 'lucide-react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface NavSubItem {
  name: string;
  href: string;
  icon?: React.ElementType;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: ('super_admin' | 'admin' | 'editor' | 'moderator')[];
  badge?: string | number;
  badgeColor?: string;
  subItems?: NavSubItem[];
}

interface NavSection {
  title: string;
  roles: ('super_admin' | 'admin' | 'editor' | 'moderator')[];
  items: NavItem[];
}

const AdminLayout: React.FC = () => {
  const { user, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Session Warning State Variables
  const [sessionTimeLeft, setSessionTimeLeft] = useState(60);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const lastActiveRef = useRef<number>(Date.now());

  // Master 2-Wing Architecture: 'main' (Main Portal & Citizen Services) vs 'adda' (Adda Social & Community Hub)
  const isAddaRoute = location.pathname.includes('moderation') || 
                      location.pathname.includes('trust-safety') || 
                      location.pathname.includes('monetization') ||
                      location.pathname.includes('adda');
  const [activeWing, setActiveWing] = useState<'main' | 'adda'>(isAddaRoute ? 'adda' : 'main');

  useEffect(() => {
    if (isAddaRoute) {
      setActiveWing('adda');
    }
  }, [location.pathname, isAddaRoute]);

  // Determine effective role
  const effectiveRole: 'super_admin' | 'admin' | 'editor' | 'moderator' = useMemo(() => {
    const r = (userProfile?.role as string) || '';
    const isMaster = user?.email === 'mdzosimuddin31@gmail.com';
    if (r === 'super_admin' || (isMaster && !r)) return 'super_admin';
    if (r === 'admin') return 'admin';
    if (r === 'editor') return 'editor';
    if (r === 'moderator') return 'moderator';
    return r === 'super_admin' ? 'super_admin' : 'admin';
  }, [userProfile, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Role details config
  const roleConfig = useMemo(() => {
    switch (effectiveRole) {
      case 'super_admin':
        return {
          title: 'সুপার অ্যাডমিন প্যানেল',
          badge: '👑 সুপার অ্যাডমিন',
          badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300/60',
          gradient: 'from-[#01412F] to-emerald-700',
          accent: 'emerald',
          dashboardHref: '/super-admin'
        };
      case 'admin':
        return {
          title: 'অ্যাডমিন ড্যাশবোর্ড',
          badge: '🛡️ অ্যাডমিনিস্ট্রেটর',
          badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300/60',
          gradient: 'from-emerald-600 to-teal-700',
          accent: 'emerald',
          dashboardHref: '/super-admin'
        };
      case 'editor':
        return {
          title: 'এডিটর পাবলিশিং হাব',
          badge: '📝 কন্টেন্ট এডিটর',
          badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-300/60',
          gradient: 'from-blue-600 to-indigo-700',
          accent: 'blue',
          dashboardHref: '/editor'
        };
      case 'moderator':
        return {
          title: 'মডারেশন ও সেফটি হাব',
          badge: '🛡️ কমিউনিটি মডারেটর',
          badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-300/60',
          gradient: 'from-purple-600 to-fuchsia-700',
          accent: 'purple',
          dashboardHref: '/moderator'
        };
    }
  }, [effectiveRole]);

  // 🌐 WING 1: MAIN PORTAL & CITIZEN SERVICES NAV SECTIONS
  const mainNavSections: NavSection[] = useMemo(() => [
    {
      title: 'প্রধান নিয়ন্ত্রণ ও ওভারভিউ',
      roles: ['super_admin', 'admin', 'editor', 'moderator'],
      items: [
        { 
          name: 'মূল ড্যাশবোর্ড', 
          href: roleConfig.dashboardHref, 
          icon: LayoutDashboard, 
          roles: ['super_admin', 'admin', 'editor', 'moderator']
        },
        { 
          name: '🟢 রিয়েল-টাইম ইউজার (Live)', 
          href: '/admin/realtime-users', 
          icon: Activity, 
          roles: ['super_admin', 'admin', 'moderator'],
          badge: 'Live',
          badgeColor: 'bg-emerald-500 text-white animate-pulse',
        },
        { 
          name: 'নোটিফিকেশন সিস্টেম', 
          href: '/admin/notifications', 
          icon: Bell, 
          roles: ['super_admin', 'admin', 'editor', 'moderator'],
        },
      ]
    },
    {
      title: 'নাগরিক ও স্টাফ ব্যবস্থাপনা (RBAC)',
      roles: ['super_admin', 'admin'],
      items: [
        { 
          name: 'নাগরিক ইউজার ও রোলস', 
          href: '/admin/users', 
          icon: Users, 
          roles: ['super_admin'],
        },
        { 
          name: 'অ্যাডমিন ও রোল টিম', 
          href: '/admin/admins', 
          icon: Shield, 
          roles: ['super_admin'],
        },
        { 
          name: 'প্রোফাইল সিস্টেম হাব', 
          href: '/admin/profiles', 
          icon: User, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
      ]
    },
    {
      title: 'মিডিয়া, ব্যানার ও কন্টেন্ট',
      roles: ['super_admin', 'admin', 'editor'],
      items: [
        { 
          name: 'হিরো স্লাইডার ও ব্যানার', 
          href: '/admin/banners', 
          icon: Sliders, 
          roles: ['super_admin', 'admin', 'editor'],
        },
        { 
          name: 'জরুরি নোটিশ বোর্ড', 
          href: '/admin/notices', 
          icon: Bell, 
          roles: ['super_admin', 'admin', 'editor'],
        },
        { 
          name: 'সংবাদ ও পুঠিয়া খবর', 
          href: '/admin/news', 
          icon: Newspaper, 
          roles: ['super_admin', 'admin', 'editor'],
        },
        { 
          name: 'ফটো ও ভিডিও গ্যালারি', 
          href: '/admin/gallery', 
          icon: ImageIcon, 
          roles: ['super_admin', 'admin', 'editor'],
        },
      ]
    },
    {
      title: 'স্বাস্থ্য, চিকিৎসা ও জরুরি সেবা',
      roles: ['super_admin', 'admin', 'editor'],
      items: [
        { 
          name: 'ডাক্তার ও হাসপাতাল সূচি', 
          href: '/admin/health', 
          icon: Heart, 
          roles: ['super_admin', 'admin', 'editor'],
        },
        { 
          name: 'রক্তদাতা নেটওয়ার্ক', 
          href: '/admin/blood-donors', 
          icon: Droplets, 
          roles: ['super_admin', 'admin'],
        },
        { 
          name: '৫২টি নাগরিক সেবা ক্যাটালগ', 
          href: '/admin/63-services', 
          icon: Sparkles, 
          roles: ['super_admin', 'admin', 'editor'],
        },
      ]
    },
    {
      title: 'ব্যবসা, বাণিজ্য ও প্রোপার্টি',
      roles: ['super_admin', 'admin'],
      items: [
        { 
          name: 'ব্যবসা ও দোকান অনুমোদন', 
          href: '/admin/businesses', 
          icon: Store, 
          roles: ['super_admin', 'admin'],
        },
        { 
          name: 'বাসা-ভাড়া ও টু-লেট', 
          href: '/admin/house-rent', 
          icon: Home, 
          roles: ['super_admin', 'admin'],
        },
        { 
          name: 'বিজ্ঞাপন ও স্পন্সরশিপ', 
          href: '/admin/advertisements', 
          icon: Megaphone, 
          roles: ['super_admin', 'admin'],
        },
      ]
    },
    {
      title: 'ক্যারিয়ার ও কৃষি ডিরেক্টরি',
      roles: ['super_admin', 'admin', 'editor'],
      items: [
        { 
          name: 'চাকরির বিজ্ঞপ্তি', 
          href: '/admin/jobs', 
          icon: Briefcase, 
          roles: ['super_admin', 'admin', 'editor'],
        },
        { 
          name: 'কৃষি তথ্য ও বাজারদর', 
          href: '/admin/agriculture', 
          icon: Sprout, 
          roles: ['super_admin', 'admin', 'editor'],
        },
        { 
          name: 'সিটিজেন ড্রয়ার ও মেনু কন্ট্রোল', 
          href: '/admin/main-menu', 
          icon: Menu, 
          roles: ['super_admin', 'admin'],
        },
      ]
    },
    {
      title: 'সিস্টেম, সেটিংস ও অডিট',
      roles: ['super_admin'],
      items: [
        { 
          name: 'সুপার অডিট ট্রেইল (Audit Logs)', 
          href: '/admin/audit-logs', 
          icon: History, 
          roles: ['super_admin'],
        },
        { 
          name: 'ওয়েবসাইট ও সাইট সেটিংস', 
          href: '/admin/settings', 
          icon: Settings, 
          roles: ['super_admin'],
        },
        { 
          name: 'সাইট বিল্ডার ও ম্যানেজমেন্ট', 
          href: '/admin/site-management', 
          icon: Globe, 
          roles: ['super_admin'],
        },
        { 
          name: 'সিকিউরিটি সেন্টার', 
          href: '/admin/security', 
          icon: ShieldCheck, 
          roles: ['super_admin'],
        },
      ]
    }
  ], [roleConfig.dashboardHref]);

  // 💬 WING 2: ADDA SOCIAL & COMMUNITY HUB NAV SECTIONS
  const addaNavSections: NavSection[] = useMemo(() => [
    {
      title: 'আড্ডা কমান্ড ও ওভারভিউ',
      roles: ['super_admin', 'admin', 'moderator'],
      items: [
        { 
          name: 'আড্ডা ড্যাশবোর্ড ও হাব', 
          href: '/admin/moderation', 
          icon: MessageSquare, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
        { 
          name: '🟢 লাইভ সোশ্যাল প্রেজেন্স', 
          href: '/admin/realtime-users?tab=live', 
          icon: Activity, 
          roles: ['super_admin', 'admin', 'moderator'],
          badge: 'Live',
          badgeColor: 'bg-purple-500 text-white animate-pulse',
        },
      ]
    },
    {
      title: 'নাগরিক কনটেন্ট মডারেশন',
      roles: ['super_admin', 'admin', 'moderator'],
      items: [
        { 
          name: 'রিপোর্ট ও মডারেশন হাব ⭐', 
          href: '/admin/reports-moderation', 
          icon: ShieldAlert, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
        { 
          name: 'আড্ডা পোস্ট ম্যানেজমেন্ট', 
          href: '/admin/adda-posts', 
          icon: FileText, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
        { 
          name: 'আড্ডা কমেন্ট ম্যানেজমেন্ট', 
          href: '/admin/adda-comments', 
          icon: MessageSquare, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
        { 
          name: 'আড্ডা মিডিয়া ম্যানেজমেন্ট', 
          href: '/admin/adda-media', 
          icon: HardDrive, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
        { 
          name: 'ফ্রেন্ডস ও ফলো কন্ট্রোল', 
          href: '/admin/adda-friends', 
          icon: UserPlus, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
        { 
          name: 'মেসেঞ্জার কন্ট্রোল ও সেফটি', 
          href: '/admin/adda-messenger', 
          icon: ShieldAlert, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
        { 
          name: 'কল ম্যানেজমেন্ট ও সেফটি', 
          href: '/admin/adda-calls', 
          icon: PhoneCall, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
        { 
          name: '🔴 Lock Down Adda (ইমার্জেন্সি)', 
          href: '/admin/emergency-moderation', 
          icon: ShieldAlert, 
          roles: ['super_admin', 'admin'],
        },
        { 
          name: '⚙️ আড্ডা সিস্টেম সেটিংস', 
          href: '/admin/adda-settings', 
          icon: Settings, 
          roles: ['super_admin', 'admin'],
        },
        { 
          name: 'আড্ডা ইউজার ম্যানেজমেন্ট', 
          href: '/admin/adda-users', 
          icon: Users, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
        { 
          name: 'নাগরিক পোস্ট মডারেশন', 
          href: '/admin/moderation?tab=posts', 
          icon: ShieldAlert, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
        { 
          name: 'কমেন্ট ও মন্তব্য মডারেশন', 
          href: '/admin/moderation?tab=comments', 
          icon: MessageSquare, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
        { 
          name: 'লাইভ স্টোরিজ ও রিলস', 
          href: '/admin/moderation?tab=stories', 
          icon: Video, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
      ]
    },
    {
      title: 'ট্রাস্ট, সেফটি ও স্প্যাম কন্ট্রোল',
      roles: ['super_admin', 'admin', 'moderator'],
      items: [
        { 
          name: 'ইউজার ফ্ল্যাগড রিপোর্টস', 
          href: '/admin/moderation?tab=reports', 
          icon: AlertCircle, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
        { 
          name: 'স্প্যাম ও অ্যান্টি-স্প্যাম রুলস', 
          href: '/admin/trust-safety', 
          icon: ShieldCheck, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
        { 
          name: 'ব্যানড ও মিউটেড আইডি', 
          href: '/admin/moderation?tab=banned', 
          icon: UserX, 
          roles: ['super_admin', 'admin', 'moderator'],
        },
      ]
    },
    {
      title: 'মনিটাইজেশন ও ক্রিয়েটর হাব',
      roles: ['super_admin', 'admin'],
      items: [
        { 
          name: '💰 মনিটাইজেশন ও ওয়ালেট', 
          href: '/admin/monetization', 
          icon: DollarSign, 
          roles: ['super_admin', 'admin'],
        },
        { 
          name: 'উইথড্রয়াল ও পেমেন্ট রিকুয়েস্ট', 
          href: '/admin/monetization?tab=withdrawals', 
          icon: FileCheck, 
          roles: ['super_admin', 'admin'],
        },
      ]
    }
  ], []);

  // Filter sections and items based on role and activeWing
  const visibleSections = useMemo(() => {
    const currentSections = activeWing === 'adda' ? addaNavSections : mainNavSections;
    return currentSections
      .filter(section => section.roles.includes(effectiveRole))
      .map(section => ({
        ...section,
        items: section.items.filter(item => item.roles.includes(effectiveRole))
      }))
      .filter(section => section.items.length > 0);
  }, [activeWing, mainNavSections, addaNavSections, effectiveRole]);

  // Mobile Bottom Navigation depending on role
  const mobileNavItems = useMemo(() => {
    if (effectiveRole === 'editor') {
      return [
        { name: 'ড্যাশবোর্ড', icon: LayoutDashboard, href: '/editor' },
        { name: 'সংবাদ', icon: Newspaper, href: '/admin/news' },
        { name: 'ইভেন্ট', icon: Calendar, href: '/admin/events' },
        { name: 'গ্যালারি', icon: ImageIcon, href: '/admin/gallery' },
        { name: 'নোটিশ', icon: Bell, href: '/admin/notices' },
      ];
    }
    if (effectiveRole === 'moderator') {
      return [
        { name: 'ড্যাশবোর্ড', icon: LayoutDashboard, href: '/moderator' },
        { name: 'মডারেশন', icon: ShieldAlert, href: '/admin/moderation' },
        { name: 'সেফটি হাব', icon: ShieldCheck, href: '/admin/trust-safety' },
        { name: 'নোটিফিকেশন', icon: Bell, href: '/admin/notifications' },
        { name: 'প্রোফাইল', icon: User, href: '/admin/profile' },
      ];
    }
    // Admin / Super Admin
    return [
      { name: 'ড্যাশবোর্ড', icon: LayoutDashboard, href: roleConfig.dashboardHref },
      { name: '৫২টি সেবা', icon: Sparkles, href: '/admin/63-services' },
      { name: 'ব্যবসা', icon: Store, href: '/admin/businesses' },
      { name: 'ইউজার', icon: Users, href: '/admin/users' },
      { name: 'সেটিংস', icon: Settings, href: '/admin/settings' },
    ];
  }, [effectiveRole, roleConfig.dashboardHref]);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("super_admin_session_active");
      await logout();
      navigate('/super-admin/login');
    } catch (error) {
      console.error('Failed to log out', error);
      sessionStorage.removeItem("super_admin_session_active");
      navigate('/super-admin/login');
    }
  };

  // Detect user activity to extend session
  useEffect(() => {
    const handleActivity = () => {
      if (!showWarningModal) {
        lastActiveRef.current = Date.now();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [showWarningModal]);

  // Session monitor loop (Runs every 2 seconds)
  useEffect(() => {
    const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes session in milliseconds
    const WARNING_THRESHOLD = 60 * 1000; // 60 seconds warning threshold

    const interval = setInterval(() => {
      if (showWarningModal) return;

      const now = Date.now();
      const elapsed = now - lastActiveRef.current;

      if (elapsed >= (SESSION_TIMEOUT - WARNING_THRESHOLD)) {
        const remainingSeconds = Math.max(0, Math.ceil((SESSION_TIMEOUT - elapsed) / 1000));
        setSessionTimeLeft(remainingSeconds > 0 ? remainingSeconds : 60);
        setShowWarningModal(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [showWarningModal]);

  // Real-time countdown when warning modal is visible
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;

    if (showWarningModal) {
      countdownInterval = setInterval(() => {
        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval!);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [showWarningModal]);

  const handleKeepSessionAlive = () => {
    lastActiveRef.current = Date.now();
    setShowWarningModal(false);
    setSessionTimeLeft(60);
    toast.success('আপনার সেশনটি সফলভাবে বর্ধিত করা হয়েছে!', {
      icon: '👑',
      style: {
        borderRadius: '16px',
        background: '#01412F',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '12px'
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-900">
      {/* Sidebar Mobile Overlay with Glass Blur */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Unified Sidebar Container */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-emerald-100 flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-xs ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header & Role Badge */}
        <div className="p-4 border-b border-emerald-100 bg-gradient-to-b from-emerald-50/60 via-white to-white flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-[#0B7A3B] flex items-center justify-center text-white font-black text-lg shadow-md shadow-[#0B7A3B]/30 ring-2 ring-emerald-200 group-hover:scale-105 transition-transform">
                পু
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-black text-slate-900 leading-tight group-hover:text-[#0B7A3B] transition-colors">আমাদের পুঠিয়া</h1>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-[#0B7A3B] border border-emerald-200">PRO</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">তথ্য ও সেবা এখন হাতের মুঠোয়</p>
              </div>
            </Link>
            <button 
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-emerald-50 rounded-xl transition-all"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Dynamic Active Role Pill Card */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 text-[11px] font-bold text-emerald-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#0B7A3B] shrink-0" />
              <span className="font-extrabold">{roleConfig.badge}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-extrabold text-[#0B7A3B]">অনলাইন</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0B7A3B]"></span>
              </span>
            </div>
          </div>

          {/* Master 2-Wing Switcher: Main Site Portal vs Adda Social Hub */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-emerald-50/80 rounded-2xl border border-emerald-200/60">
            <button
              type="button"
              onClick={() => setActiveWing('main')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                activeWing === 'main'
                  ? 'bg-[#0B7A3B] text-white shadow-sm shadow-[#0B7A3B]/30'
                  : 'text-slate-600 hover:text-[#0B7A3B] hover:bg-white/80'
              }`}
            >
              <Globe size={13} />
              <span>🌐 মেইন সাইট</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveWing('adda')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                activeWing === 'adda'
                  ? 'bg-[#01412F] text-white shadow-sm shadow-[#01412F]/30'
                  : 'text-slate-600 hover:text-[#01412F] hover:bg-white/80'
              }`}
            >
              <MessageSquare size={13} />
              <span>💬 আড্ডা সোশ্যাল</span>
            </button>
          </div>
        </div>

        {/* Dynamic Nav Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
          {visibleSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {/* Section Header */}
              <div className="flex items-center gap-2 px-3 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B7A3B] shadow-xs"></span>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/80 truncate">
                  {section.title}
                </p>
              </div>

              {/* Section Nav Items */}
              {section.items.map((item) => {
                const currentFullUrl = location.pathname + (location.search || '');
                const Icon = item.icon;
                const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
                
                // Determine if parent or child is currently active
                const isExactActive = location.pathname === item.href;
                const isChildActive = Boolean(hasSubItems && item.subItems!.some(sub => {
                  const subQuery = sub.href.includes('?') ? sub.href.split('?')[1] : '';
                  if (currentFullUrl === sub.href) return true;
                  if (subQuery && location.search.includes(subQuery)) return true;
                  return false;
                }));
                const isParentPathActive = item.href !== '/admin' && item.href !== '/super-admin' && item.href !== '/editor' && item.href !== '/moderator' && location.pathname.startsWith(item.href);
                const isParentActive = isExactActive || isChildActive || isParentPathActive;
                
                const isExpanded = expandedMenus[item.name] ?? isParentActive;

                const handleMainClick = (e: React.MouseEvent) => {
                  if (hasSubItems) {
                    setExpandedMenus(prev => ({
                      ...prev,
                      [item.name]: !isExpanded
                    }));
                  } else {
                    setSidebarOpen(false);
                  }
                };
                
                const menuContent = (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isExactActive || (isParentPathActive && !hasSubItems)
                          ? 'bg-white/20 text-white shadow-2xs' 
                          : isParentActive
                          ? 'bg-[#0B7A3B] text-white shadow-2xs'
                          : 'bg-emerald-50 text-[#0B7A3B] group-hover:bg-[#0B7A3B] group-hover:text-white'
                      }`}>
                        <Icon size={15} />
                      </div>
                      <span className="truncate font-extrabold text-[12px]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-black shadow-2xs uppercase tracking-wide ${
                          item.badge === 'Live' 
                            ? 'bg-[#0B7A3B] text-white animate-pulse' 
                            : item.badgeColor || 'bg-emerald-100 text-[#0B7A3B]'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {hasSubItems && (
                        <div className={`p-1 rounded-lg transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#0B7A3B]' : 'text-slate-400 group-hover:text-[#0B7A3B]'}`}>
                          <ChevronDown size={14} />
                        </div>
                      )}
                    </div>
                  </>
                );

                const menuClass = `flex items-center justify-between min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer group ${
                  isExactActive || (isParentPathActive && !hasSubItems)
                    ? 'bg-[#0B7A3B] text-white shadow-md shadow-[#0B7A3B]/25 translate-x-0.5' 
                    : isParentActive
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-black'
                    : 'text-slate-700 hover:bg-emerald-50/80 hover:text-[#0B7A3B] hover:translate-x-0.5'
                }`;

                return (
                  <div key={item.name} className="space-y-1">
                    {hasSubItems ? (
                      <div
                        role="button"
                        onClick={handleMainClick}
                        className={menuClass}
                      >
                        {menuContent}
                      </div>
                    ) : (
                      <Link
                        to={item.href}
                        onClick={handleMainClick}
                        className={menuClass}
                      >
                        {menuContent}
                      </Link>
                    )}

                    {/* Sub Items Dropdown Accordion Tree */}
                    <AnimatePresence initial={false}>
                      {hasSubItems && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-3.5 pr-1 py-1 space-y-1 border-l-2 border-emerald-500/30 hover:border-emerald-500/60 ml-5 my-1 transition-colors"
                        >
                          {item.subItems!.map((sub) => {
                            const SubIcon = sub.icon || Globe;
                            const subQuery = sub.href.includes('?') ? sub.href.split('?')[1] : '';
                            let isSubActive = currentFullUrl === sub.href;
                            if (!isSubActive && subQuery) {
                              isSubActive = location.pathname === sub.href.split('?')[0] && location.search.includes(subQuery);
                            }
                            
                            return (
                              <Link
                                key={sub.name}
                                to={sub.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[11.5px] font-bold transition-all duration-200 min-h-[34px] group ${
                                  isSubActive 
                                    ? 'bg-[#0B7A3B] text-white shadow-2xs font-extrabold translate-x-0.5' 
                                    : 'text-slate-600 hover:text-[#0B7A3B] hover:bg-emerald-50/80'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                                    isSubActive 
                                      ? 'bg-white/20 text-white' 
                                      : 'bg-emerald-50 text-[#0B7A3B] group-hover:bg-[#0B7A3B] group-hover:text-white'
                                  }`}>
                                    <SubIcon size={12} />
                                  </div>
                                  <span className="truncate">{sub.name}</span>
                                </div>
                                {isSubActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs shrink-0 animate-pulse" />
                                )}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer & User Overview */}
        <div className="p-3 border-t border-emerald-100 bg-gradient-to-b from-white to-emerald-50/50 space-y-2 shrink-0">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 text-xs font-black text-white bg-[#0B7A3B] hover:bg-emerald-800 rounded-xl shadow-md shadow-[#0B7A3B]/20 transition-all group cursor-pointer"
          >
            <Eye size={15} className="text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>মূল সাইট দেখুন (Live View)</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3.5 py-2 text-xs font-black text-[#E11D2E] bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <LogOut size={14} />
            <span>➔ লগ আউট</span>
          </button>

          {/* Bottom Bangladesh / Puthia Flag Dual Wave Ribbon (#0B7A3B & #E11D2E) */}
          <div className="w-full h-2.5 relative overflow-hidden mt-1 rounded-full">
            <svg viewBox="0 0 340 20" className="w-full h-full object-cover" preserveAspectRatio="none">
              <path d="M0,4 C110,18 230,-2 340,14 L340,20 L0,20 Z" fill="#0B7A3B" />
              <path d="M0,10 C130,22 210,4 340,18 L340,20 L0,20 Z" fill="#E11D2E" opacity="0.95" />
            </svg>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-emerald-100 px-4 md:px-6 py-2.5 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-1.5 text-slate-600 hover:text-[#0B7A3B] hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Portal Title Indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0B7A3B] animate-pulse"></span>
              <span className="text-xs font-black text-slate-800">আমাদের পুঠিয়া • অ্যাডমিন কন্ট্রোল</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Link to Notifications */}
            <Link 
              to="/admin/notifications" 
              className="w-8 h-8 rounded-xl border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-50 relative transition-colors"
              title="অ্যাডমিন নোটিফিকেশন"
            >
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            </Link>
            
            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-slate-50 border border-slate-200/70 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xs shadow-xs">
                  {user?.displayName ? user.displayName.charAt(0) : 'A'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-black text-slate-800 leading-tight truncate max-w-[110px]">{user?.displayName || 'অ্যাডমিন'}</p>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase">{effectiveRole.replace('_', ' ')}</p>
                </div>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3 z-50"
                  >
                    <div className="flex items-center gap-3 p-2 mb-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs">
                        {user?.displayName ? user.displayName.charAt(0) : 'A'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-900 text-xs truncate">{user?.displayName || 'অ্যাডমিন'}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded-sm">
                          {roleConfig.badge}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      {[
                        { icon: User, label: 'আমার প্রোফাইল', href: '/admin/profile' },
                        { icon: Pencil, label: 'প্রোফাইল এডিট করুন', href: '/admin/profile/edit' },
                        { icon: Lock, label: 'পাসওয়ার্ড ও নিরাপত্তা', href: '/admin/password' },
                        { icon: Settings, label: 'সিস্টেম সেটিংস', href: '/admin/settings' },
                        { icon: HelpCircle, label: 'সাহায্য ও সাপোর্ট', href: '/admin/support' },
                      ].map((item) => (
                        <Link 
                          key={item.label} 
                          to={item.href} 
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
                        >
                          <item.icon size={15} className="text-slate-400" />
                          {item.label}
                        </Link>
                      ))}
                      <div className="pt-1 mt-1 border-t border-slate-100">
                        <button 
                          onClick={handleLogout} 
                          className="flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold w-full transition-colors cursor-pointer"
                        >
                          <LogOut size={15} />
                          লগআউট
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Content Area - Full width edge-to-edge responsive layout */}
        <div className="flex-1 overflow-y-auto bg-slate-50/70 p-2 sm:p-4 md:p-6 w-full min-h-full">
          <div className="w-full">
            <Outlet />
          </div>
        </div>
        
        {/* Responsive Role-Adaptive Mobile Bottom Navigation */}
        <div className="lg:hidden bg-white border-t border-slate-200/80 px-2 py-1.5 flex justify-around items-center shrink-0 z-20 shadow-xs">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link 
                key={item.name} 
                to={item.href} 
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${
                  isActive ? 'text-emerald-600 font-black' : 'text-slate-400 font-bold'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Session Expiry Warning Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Dark glass backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 rounded-[28px] p-7 max-w-sm w-full border border-amber-100 dark:border-amber-950/40 shadow-2xl relative overflow-hidden text-center z-10"
            >
              {/* Alert Icon Badge */}
              <div className="relative flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center border-4 border-amber-100/50 dark:border-amber-900/20">
                  <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
                </div>
              </div>

              {/* Warnings Texts */}
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1.5">
                অ্যাডমিন সেশন শেষ হতে চলেছে!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                আপনি দীর্ঘ সময় ধরে নিষ্ক্রিয় আছেন। আপনার গুরুত্বপূর্ণ ডেটা বা কাজ যাতে হারিয়ে না যায়, সেজন্য অনুগ্রহ করে সেশনটি সচল রাখুন।
              </p>

              {/* Countdown Tracker Box */}
              <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/40 rounded-2xl py-3 px-4 mb-6">
                <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider block mb-1">
                  স্বয়ংক্রিয় লগ আউটের বাকি আছে
                </span>
                <span className="text-2xl font-black text-amber-600 font-mono tracking-tight animate-pulse">
                  {sessionTimeLeft} সেকেন্ড
                </span>
              </div>

              {/* Action Triggers */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleKeepSessionAlive}
                  className="w-full py-3 bg-[#01412F] hover:bg-[#013023] text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-98"
                >
                  👑 সেশন বর্ধিত করুন
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-rose-600 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  লগ আউট করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLayout;

