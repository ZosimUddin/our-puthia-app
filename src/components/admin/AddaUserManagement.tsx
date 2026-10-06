import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  Ban, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  UserX, 
  Loader2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  MoreVertical, 
  RefreshCw, 
  Shield, 
  Trash2, 
  Edit, 
  Eye, 
  Key, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Heart, 
  Flame, 
  Award, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Radio, 
  ArrowUpRight, 
  Check, 
  X,
  UserMinus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { useAuth, UserProfile } from '../../contexts/AuthContext';
import { logAuditActivity } from '../../services/auditLogger';
import { logAdminAction } from '../../services/adminService';
import toast from 'react-hot-toast';

export type UserAccountStatus = 'active' | 'inactive' | 'suspended' | 'banned';

export interface AddaUserData extends Partial<UserProfile> {
  uid: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: UserProfile['role'];
  status?: UserAccountStatus;
  statusReason?: string;
  suspendedUntil?: string | number | null;
  isVerified?: boolean;
  isBlocked?: boolean;
  nidVerified?: boolean;
  nidNumber?: string;
  union?: string;
  village?: string;
  bio?: string;
  createdAt?: string;
  lastActive?: string;
  postsCount?: number;
  commentsCount?: number;
  followersCount?: number;
  likesCount?: number;
  warningsCount?: number;
  reportsReceivedCount?: number;
}

// Bengali number helper
const toBn = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "০";
  return String(num).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
};

export const AddaUserManagement: React.FC = () => {
  const { user, userProfile } = useAuth();

  // State
  const [users, setUsers] = useState<AddaUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'verified' | 'suspended' | 'banned' | 'blocked'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'activity' | 'reports'>('newest');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [viewUser, setViewUser] = useState<AddaUserData | null>(null);
  const [suspendModalUser, setSuspendModalUser] = useState<AddaUserData | null>(null);
  const [suspendDays, setSuspendDays] = useState<number>(7);
  const [suspendReason, setSuspendReason] = useState<string>('কমিউনিটি নির্দেশিকা ও নিয়মাবলী লঙ্ঘন');
  
  const [banModalUser, setBanModalUser] = useState<AddaUserData | null>(null);
  const [banReason, setBanReason] = useState<string>('গুরুতর অপপ্রচার বা স্প্যামিং');

  const [deleteModalUser, setDeleteModalUser] = useState<AddaUserData | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState<string>('');

  const [roleModalUser, setRoleModalUser] = useState<AddaUserData | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserProfile['role']>('user');

  // 1. Subscribe to Live Firestore Users
  useEffect(() => {
    setLoading(true);
    try {
      const usersQuery = query(collection(db, 'users'), limit(500));
      const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const fetchedList: AddaUserData[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedList.push({
            uid: docSnap.id,
            name: data.name || data.displayName || 'নামহীন নাগরিক',
            username: data.username || data.email?.split('@')[0] || `user_${docSnap.id.slice(0, 5)}`,
            email: data.email || '',
            phone: data.phone || data.phoneNumber || '',
            role: data.role || 'user',
            status: data.status || (data.isBlocked ? 'banned' : 'active'),
            statusReason: data.statusReason || '',
            suspendedUntil: data.suspendedUntil || null,
            isVerified: Boolean(data.isVerified || data.verified),
            isBlocked: Boolean(data.isBlocked || data.status === 'banned'),
            nidVerified: Boolean(data.nidVerified),
            nidNumber: data.nidNumber || '',
            union: data.union || 'পুঠিয়া',
            village: data.village || '',
            bio: data.bio || '',
            photoURL: data.photoURL || '',
            createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? data.createdAt : new Date(data.createdAt.seconds * 1000).toISOString()) : '',
            lastActive: data.lastActive ? (typeof data.lastActive === 'string' ? data.lastActive : new Date(data.lastActive.seconds * 1000).toISOString()) : '',
            postsCount: data.postsCount || data.addaPostsCount || 0,
            commentsCount: data.commentsCount || 0,
            followersCount: data.followersCount || 0,
            likesCount: data.likesCount || 0,
            warningsCount: data.warningsCount || 0,
            reportsReceivedCount: data.reportsReceivedCount || 0,
          });
        });
        setUsers(fetchedList);
        setLoading(false);
      }, (err) => {
        console.error('Firestore users onSnapshot error:', err);
        setLoading(false);
        toast.error('লাইভ ইউজার ডাটা লোড করতে সমস্যা হয়েছে');
      });

      return () => unsubscribe();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active' && !u.isBlocked).length,
      inactive: users.filter(u => u.status === 'inactive').length,
      verified: users.filter(u => u.isVerified).length,
      suspended: users.filter(u => u.status === 'suspended').length,
      banned: users.filter(u => u.status === 'banned' || u.isBlocked).length,
      blocked: users.filter(u => u.isBlocked).length,
    };
  }, [users]);

  // Filtered and Sorted Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (u.name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.union || '').toLowerCase().includes(q) ||
        (u.village || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      );

      // 2. Tab filter
      let matchesTab = true;
      if (activeTab === 'active') matchesTab = u.status === 'active' && !u.isBlocked;
      else if (activeTab === 'inactive') matchesTab = u.status === 'inactive';
      else if (activeTab === 'verified') matchesTab = Boolean(u.isVerified);
      else if (activeTab === 'suspended') matchesTab = u.status === 'suspended';
      else if (activeTab === 'banned') matchesTab = u.status === 'banned';
      else if (activeTab === 'blocked') matchesTab = Boolean(u.isBlocked);

      // 3. Role filter
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesTab && matchesRole;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'bn');
      if (sortBy === 'activity') return (b.postsCount || 0) - (a.postsCount || 0);
      if (sortBy === 'reports') return (b.reportsReceivedCount || 0) - (a.reportsReceivedCount || 0);
      return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
    });
  }, [users, searchQuery, activeTab, roleFilter, sortBy]);

  // ---------------- ACTION HANDLERS ---------------- //

  // Toggle Active / Inactive
  const handleToggleActive = async (targetUser: AddaUserData) => {
    const nextStatus: UserAccountStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        status: nextStatus,
        isBlocked: false,
        updatedAt: serverTimestamp()
      });

      await logAuditActivity({
        action: 'UPDATE_USER_STATUS',
        details: `সুপার এডমিন ${targetUser.name} (${targetUser.email || targetUser.uid})-এর স্ট্যাটাস ${nextStatus} করেছেন`,
        category: 'security',
        severity: 'info',
        targetType: 'user',
        targetId: targetUser.uid,
        targetName: targetUser.name
      });

      toast.success(`${targetUser.name} এখন ${nextStatus === 'active' ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}`);
      if (viewUser?.uid === targetUser.uid) {
        setViewUser({ ...viewUser, status: nextStatus, isBlocked: false });
      }
    } catch (err: any) {
      toast.error('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Verified User (Blue Badge)
  const handleToggleVerified = async (targetUser: AddaUserData) => {
    const nextVerified = !targetUser.isVerified;
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        isVerified: nextVerified,
        verified: nextVerified,
        updatedAt: serverTimestamp()
      });

      await logAuditActivity({
        action: 'TOGGLE_USER_VERIFIED_BADGE',
        details: `সুপার এডমিন ${targetUser.name}-এর ভেরিফাইড ব্লু ব্যাজ ${nextVerified ? 'অনুমোদন' : 'প্রত্যাহার'} করেছেন`,
        category: 'user',
        severity: 'info',
        targetType: 'user',
        targetId: targetUser.uid,
        targetName: targetUser.name
      });

      toast.success(nextVerified ? `🎉 ${targetUser.name} এখন ভেরিফাইড ইউজার!` : `${targetUser.name}-এর ভেরিফিকেশন প্রত্যাহার করা হয়েছে`);
      if (viewUser?.uid === targetUser.uid) {
        setViewUser({ ...viewUser, isVerified: nextVerified });
      }
    } catch (err) {
      toast.error('ভেরিফিকেশন আপডেট ব্যর্থ হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // Suspend User with Duration
  const handleConfirmSuspend = async () => {
    if (!suspendModalUser) return;
    setActionLoading(true);
    try {
      const untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + suspendDays);

      const userRef = doc(db, 'users', suspendModalUser.uid);
      await updateDoc(userRef, {
        status: 'suspended',
        statusReason: suspendReason,
        suspendedUntil: untilDate.toISOString(),
        updatedAt: serverTimestamp()
      });

      await logAuditActivity({
        action: 'SUSPEND_USER',
        details: `সুপার এডমিন ${suspendModalUser.name}-কে ${toBn(suspendDays)} দিনের জন্য সাময়িক স্থগিত করেছেন। কারণ: ${suspendReason}`,
        category: 'security',
        severity: 'warning',
        targetType: 'user',
        targetId: suspendModalUser.uid,
        targetName: suspendModalUser.name
      });

      toast.success(`⚠️ ${suspendModalUser.name}-কে ${toBn(suspendDays)} দিনের জন্য স্থগিত (Suspended) করা হয়েছে`);
      setSuspendModalUser(null);
      if (viewUser?.uid === suspendModalUser.uid) {
        setViewUser({ ...viewUser, status: 'suspended', statusReason: suspendReason, suspendedUntil: untilDate.toISOString() });
      }
    } catch (err) {
      toast.error('স্থগিতকরণ ব্যর্থ হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // Unsuspend User
  const handleUnsuspend = async (targetUser: AddaUserData) => {
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        status: 'active',
        statusReason: '',
        suspendedUntil: null,
        updatedAt: serverTimestamp()
      });

      await logAuditActivity({
        action: 'UNSUSPEND_USER',
        details: `সুপার এডমিন ${targetUser.name}-এর স্থগিতাদেশ প্রত্যাহার করে সক্রিয় করেছেন`,
        category: 'security',
        severity: 'info',
        targetType: 'user',
        targetId: targetUser.uid,
        targetName: targetUser.name
      });

      toast.success(`✅ ${targetUser.name}-এর স্থগিতাদেশ সফলভাবে প্রত্যাহার করা হয়েছে!`);
      if (viewUser?.uid === targetUser.uid) {
        setViewUser({ ...viewUser, status: 'active', statusReason: '', suspendedUntil: null });
      }
    } catch (err) {
      toast.error('স্থগিতাদেশ প্রত্যাহার ব্যর্থ হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // Ban User Permanently
  const handleConfirmBan = async () => {
    if (!banModalUser) return;
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', banModalUser.uid);
      await updateDoc(userRef, {
        status: 'banned',
        isBlocked: true,
        statusReason: banReason,
        updatedAt: serverTimestamp()
      });

      await logAuditActivity({
        action: 'BAN_USER_PERMANENTLY',
        details: `সুপার এডমিন ${banModalUser.name}-কে স্থায়ীভাবে ব্যান ও ব্লক করেছেন। কারণ: ${banReason}`,
        category: 'security',
        severity: 'critical',
        targetType: 'user',
        targetId: banModalUser.uid,
        targetName: banModalUser.name
      });

      toast.success(`🚫 ${banModalUser.name}-কে স্থায়ীভাবে ব্যান ও ব্লক করা হয়েছে`);
      setBanModalUser(null);
      if (viewUser?.uid === banModalUser.uid) {
        setViewUser({ ...viewUser, status: 'banned', isBlocked: true, statusReason: banReason });
      }
    } catch (err) {
      toast.error('ব্যানকরণ ব্যর্থ হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // Unban / Unblock User
  const handleUnban = async (targetUser: AddaUserData) => {
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        status: 'active',
        isBlocked: false,
        statusReason: '',
        updatedAt: serverTimestamp()
      });

      await logAuditActivity({
        action: 'UNBAN_USER',
        details: `সুপার এডমিন ${targetUser.name}-এর ব্যান ও ব্লক অপসারণ করে সক্রিয় করেছেন`,
        category: 'security',
        severity: 'info',
        targetType: 'user',
        targetId: targetUser.uid,
        targetName: targetUser.name
      });

      toast.success(`🔓 ${targetUser.name}-এর ব্যান ও ব্লক সফলভাবে তুলে নেওয়া হয়েছে`);
      if (viewUser?.uid === targetUser.uid) {
        setViewUser({ ...viewUser, status: 'active', isBlocked: false, statusReason: '' });
      }
    } catch (err) {
      toast.error('আনব্যান ব্যর্থ হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // Block / Unblock Instant Toggle
  const handleToggleBlock = async (targetUser: AddaUserData) => {
    const nextBlocked = !targetUser.isBlocked;
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        isBlocked: nextBlocked,
        status: nextBlocked ? 'banned' : 'active',
        updatedAt: serverTimestamp()
      });

      await logAuditActivity({
        action: nextBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
        details: `সুপার এডমিন ${targetUser.name}-কে ${nextBlocked ? 'ব্লক' : 'আনব্লক'} করেছেন`,
        category: 'security',
        severity: nextBlocked ? 'warning' : 'info',
        targetType: 'user',
        targetId: targetUser.uid,
        targetName: targetUser.name
      });

      toast.success(nextBlocked ? `🔒 ${targetUser.name} এখন ব্লকড` : `🔓 ${targetUser.name} এখন আনব্লকড`);
      if (viewUser?.uid === targetUser.uid) {
        setViewUser({ ...viewUser, isBlocked: nextBlocked, status: nextBlocked ? 'banned' : 'active' });
      }
    } catch (err) {
      toast.error('ব্লক স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // Role Change
  const handleConfirmRoleChange = async () => {
    if (!roleModalUser) return;
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', roleModalUser.uid);
      await updateDoc(userRef, {
        role: selectedRole,
        updatedAt: serverTimestamp()
      });

      await logAuditActivity({
        action: 'CHANGE_USER_ROLE',
        details: `সুপার এডমিন ${roleModalUser.name}-এর রোল পরিবর্তন করে '${selectedRole}' করেছেন`,
        category: 'user',
        severity: 'warning',
        targetType: 'user',
        targetId: roleModalUser.uid,
        targetName: roleModalUser.name
      });

      toast.success(`🎖️ ${roleModalUser.name}-এর রোল সফলভাবে '${selectedRole}' করা হয়েছে!`);
      setRoleModalUser(null);
      if (viewUser?.uid === roleModalUser.uid) {
        setViewUser({ ...viewUser, role: selectedRole });
      }
    } catch (err) {
      toast.error('রোল পরিবর্তন ব্যর্থ হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // Hard Delete User Account
  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    if (confirmDeleteText !== 'DELETE') {
      toast.error('নিশ্চিত করতে "DELETE" লিখুন');
      return;
    }

    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'users', deleteModalUser.uid));

      await logAuditActivity({
        action: 'DELETE_USER_ACCOUNT',
        details: `সুপার এডমিন ${deleteModalUser.name} (${deleteModalUser.email || deleteModalUser.uid})-এর অ্যাকাউন্ট ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলেছেন`,
        category: 'security',
        severity: 'critical',
        targetType: 'user',
        targetId: deleteModalUser.uid,
        targetName: deleteModalUser.name
      });

      toast.success(`🗑️ ${deleteModalUser.name}-এর অ্যাকাউন্ট স্থায়ীভাবে ডিলিট করা হয়েছে`);
      setDeleteModalUser(null);
      setConfirmDeleteText('');
      if (viewUser?.uid === deleteModalUser.uid) {
        setViewUser(null);
      }
    } catch (err) {
      toast.error('অ্যাকাউন্ট ডিলিট করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in font-sans pb-16">
      
      {/* 1. TOP MASTER GREEN BANNER */}
      <div className="bg-gradient-to-br from-[#0B7A3B] via-[#01412F] to-[#042A1E] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-300/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-xs shrink-0">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                  লাইভ ইউজার কমান্ড হাব
                </span>
                <span className="text-[11px] font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  মোট নিবন্ধিত: {toBn(metrics.total)} জন
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                আড্ডা ও পোর্টাল ইউজার ম্যানেজমেন্ট
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1">
                সকল নাগরিক ও আড্ডা সোশ্যাল নেটওয়ার্ক ইউজারদের একাউন্ট নিয়ন্ত্রণ, ভেরিফিকেশন ও সিকিউরিটি কমান্ড সেন্টার
              </p>
            </div>
          </div>

          {/* Quick Realtime Refresh */}
          <div className="flex items-center gap-2">
            <div className="bg-emerald-950/70 px-4 py-2 rounded-2xl border border-emerald-400/30 backdrop-blur-md text-xs font-bold text-emerald-200">
              সক্রিয় ইউজার: <strong className="text-white font-black">{toBn(metrics.active)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'সকল ইউজার', count: metrics.total, tab: 'all', icon: Users, color: 'text-[#0B7A3B] bg-emerald-50 border-emerald-200' },
          { label: 'সক্রিয় (Active)', count: metrics.active, tab: 'active', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50/80 border-emerald-200' },
          { label: 'ভেরিফাইড (Blue)', count: metrics.verified, tab: 'verified', icon: ShieldCheck, color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { label: 'স্থগিত (Suspended)', count: metrics.suspended, tab: 'suspended', icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { label: 'ব্যানড (Banned)', count: metrics.banned, tab: 'banned', icon: Ban, color: 'text-rose-700 bg-rose-50 border-rose-200' },
          { label: 'ব্লকড (Blocked)', count: metrics.blocked, tab: 'blocked', icon: Lock, color: 'text-purple-700 bg-purple-50 border-purple-200' },
        ].map((item) => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab as any)}
            className={`p-3 min-h-[82px] rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              activeTab === item.tab 
                ? 'bg-white border-[#0B7A3B] ring-2 ring-[#0B7A3B]/20 shadow-sm' 
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-700 leading-tight flex-1 break-words">{item.label}</span>
              <div className={`p-1.5 rounded-xl border shrink-0 ${item.color}`}>
                <item.icon size={13} />
              </div>
            </div>
            <p className="text-base sm:text-lg font-black text-slate-900 leading-none">{toBn(item.count)}</p>
          </button>
        ))}
      </div>

      {/* 3. SEARCH & CONTROLS BAR */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="নাম, ইউজারনেম, ইমেইল, ফোন নম্বর বা গ্রাম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-emerald-200 text-slate-900 rounded-xl text-xs font-bold placeholder-slate-400 focus:outline-none focus:border-[#0B7A3B]"
            />
          </div>

          {/* Role Filter & Sort dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700">
              <Shield size={14} className="text-[#0B7A3B]" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">সকল রোল</option>
                <option value="super_admin">সুপার এডমিন</option>
                <option value="admin">এডমিন</option>
                <option value="moderator">মডারেটর</option>
                <option value="creator">ক্রিয়েটর</option>
                <option value="user">নাগরিক ইউজার</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700">
              <Filter size={14} className="text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer"
              >
                <option value="newest">সর্বশেষ যুক্ত</option>
                <option value="name">নাম অনুযায়ী</option>
                <option value="activity">সর্বাধিক পোস্ট</option>
                <option value="reports">ফ্ল্যাগড রিপোর্ট</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none w-full min-w-0">
          {[
            { id: 'all', label: `সকল ইউজার (${toBn(metrics.total)})` },
            { id: 'active', label: `🟢 সক্রিয় (${toBn(metrics.active)})` },
            { id: 'verified', label: `🛡️ ভেরিফাইড (${toBn(metrics.verified)})` },
            { id: 'suspended', label: `⏳ স্থগিত (${toBn(metrics.suspended)})` },
            { id: 'banned', label: `🚫 ব্যানড (${toBn(metrics.banned)})` },
            { id: 'blocked', label: `🔒 ব্লকড (${toBn(metrics.blocked)})` },
            { id: 'inactive', label: `⚪ নিষ্ক্রিয় (${toBn(metrics.inactive)})` },
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

      {/* 4. USER LIST TABLE & CARDS */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B7A3B] mb-2" />
            <p className="text-xs font-bold">ইউজার ডাটাবেজ লোড হচ্ছে...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-black">কোনো ইউজার পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-1">অন্য কোনো ফিল্টার বা অনুসন্ধান শব্দ ব্যবহার করে দেখুন</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/60 border-b border-emerald-100 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  <th className="p-4">ইউজার তথ্য</th>
                  <th className="p-4">রোল ও ভেরিফিকেশন</th>
                  <th className="p-4">স্ট্যাটাস</th>
                  <th className="p-4">আড্ডা পরিসংখ্যান</th>
                  <th className="p-4">ঠিকানা ও যোগদান</th>
                  <th className="p-4 text-right">সুপার এডমিন অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredUsers.map((u) => {
                  const isSuspended = u.status === 'suspended';
                  const isBanned = u.status === 'banned' || u.isBlocked;
                  const isActive = u.status === 'active' && !u.isBlocked;

                  return (
                    <tr key={u.uid} className="hover:bg-emerald-50/20 transition-colors">
                      {/* 1. User Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="" className="w-10 h-10 rounded-2xl object-cover border border-emerald-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0B7A3B] to-teal-700 text-white flex items-center justify-center font-black text-sm">
                                {u.name[0] || 'U'}
                              </div>
                            )}
                            {u.isVerified && (
                              <span className="absolute -bottom-1 -right-1 p-0.5 bg-blue-600 text-white rounded-full shadow-xs" title="ভেরিফাইড নাগরিক">
                                <Check size={10} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-900 text-sm">{u.name}</span>
                              {u.isVerified && (
                                <span className="text-blue-600 font-bold" title="ভেরিফাইড প্রোফাইল">✓</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>
                            <p className="text-[11px] text-slate-500">{u.phone || u.email || 'কোনো কন্টাক্ট নেই'}</p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Role & Verification */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            u.role === 'super_admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            u.role === 'admin' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            u.role === 'moderator' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            u.role === 'editor' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            <Shield size={10} />
                            {u.role === 'super_admin' ? 'সুপার এডমিন' :
                             u.role === 'admin' ? 'এডমিন' :
                             u.role === 'moderator' ? 'মডারেটর' :
                             u.role === 'editor' ? 'এডিটর / ক্রিয়েটর' : 'নাগরিক'}
                          </span>
                          <div>
                            <button
                              onClick={() => handleToggleVerified(u)}
                              disabled={actionLoading}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${
                                u.isVerified 
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {u.isVerified ? '✓ ভেরিফাইড' : '+ ভেরিফাই করুন'}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 3. Status Badge */}
                      <td className="p-4">
                        <div>
                          {isBanned ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                              <Ban size={12} /> ব্যানড / ব্লকড
                            </span>
                          ) : isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock size={12} /> স্থগিত (Suspended)
                            </span>
                          ) : isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> সক্রিয় (Active)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-700">
                              নিষ্ক্রিয় (Inactive)
                            </span>
                          )}
                          {u.statusReason && (
                            <p className="text-[10px] text-slate-400 mt-1 truncate max-w-xs">{u.statusReason}</p>
                          )}
                        </div>
                      </td>

                      {/* 4. Adda Stats */}
                      <td className="p-4">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">পোস্ট: <strong className="text-slate-900">{toBn(u.postsCount || 0)}</strong></span>
                            <span>•</span>
                            <span className="text-slate-500">মন্তব্য: <strong className="text-slate-900">{toBn(u.commentsCount || 0)}</strong></span>
                          </div>
                          {(u.reportsReceivedCount || 0) > 0 && (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              <AlertTriangle size={11} /> {toBn(u.reportsReceivedCount)}টি রিপোর্ট প্রাপ্ত
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Location & Joined */}
                      <td className="p-4 text-[11px] text-slate-500">
                        <p className="font-bold text-slate-700">{u.union || 'পুঠিয়া'}{u.village ? `, ${u.village}` : ''}</p>
                        <p className="text-slate-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('bn-BD') : 'তারিখ নেই'}</p>
                      </td>

                      {/* 6. Super Admin Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile Modal Button */}
                          <button
                            onClick={() => setViewUser(u)}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0B7A3B] transition-colors cursor-pointer"
                            title="ইউজার প্রোফাইল দেখুন"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Suspend / Unsuspend */}
                          {isSuspended ? (
                            <button
                              onClick={() => handleUnsuspend(u)}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="স্থগিতাদেশ প্রত্যাহার করুন"
                            >
                              <Unlock size={13} /> আন-সাসপেন্ড
                            </button>
                          ) : (
                            <button
                              onClick={() => setSuspendModalUser(u)}
                              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                              title="ইউজার স্থগিত করুন"
                            >
                              <Clock size={15} />
                            </button>
                          )}

                          {/* Ban / Unban */}
                          {isBanned ? (
                            <button
                              onClick={() => handleUnban(u)}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="আনব্যান করুন"
                            >
                              <CheckCircle2 size={13} /> আনব্যান
                            </button>
                          ) : (
                            <button
                              onClick={() => setBanModalUser(u)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="ব্যান / ব্লক করুন"
                            >
                              <Ban size={15} />
                            </button>
                          )}

                          {/* Role Change Modal */}
                          <button
                            onClick={() => {
                              setRoleModalUser(u);
                              setSelectedRole(u.role || 'user');
                            }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="রোল পরিবর্তন"
                          >
                            <Shield size={15} />
                          </button>

                          {/* Delete Account */}
                          <button
                            onClick={() => {
                              setDeleteModalUser(u);
                              setConfirmDeleteText('');
                            }}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="অ্যাকাউন্ট ডিলিট করুন"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ----------------- MODAL 1: VIEW USER PROFILE ----------------- */}
      <AnimatePresence>
        {viewUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-emerald-100"
            >
              {/* Header Banner */}
              <div className="bg-gradient-to-br from-[#0B7A3B] via-[#01412F] to-[#042A1E] p-6 text-white relative">
                <button
                  onClick={() => setViewUser(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-4">
                  {viewUser.photoURL ? (
                    <img src={viewUser.photoURL} alt="" className="w-16 h-16 rounded-3xl object-cover border-2 border-white/40 shadow-md" />
                  ) : (
                    <div className="w-16 h-16 rounded-3xl bg-white/20 text-white flex items-center justify-center font-black text-2xl border border-white/30">
                      {viewUser.name[0] || 'U'}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-black">{viewUser.name}</h2>
                      {viewUser.isVerified && (
                        <span className="px-2.5 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded-full flex items-center gap-1">
                          <Check size={10} strokeWidth={3} /> ভেরিফাইড
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 bg-white/20 text-white text-[10px] font-black rounded-full uppercase">
                        {viewUser.role}
                      </span>
                    </div>
                    <p className="text-emerald-200 text-xs font-mono">@{viewUser.username}</p>
                    <p className="text-emerald-100 text-xs mt-1">UID: <span className="font-mono text-[11px] opacity-80">{viewUser.uid}</span></p>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center">
                    <p className="text-xs text-slate-500 font-bold">মোট পোস্ট</p>
                    <p className="text-lg font-black text-[#0B7A3B]">{toBn(viewUser.postsCount || 0)}</p>
                  </div>
                  <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-center">
                    <p className="text-xs text-slate-500 font-bold">মন্তব্য</p>
                    <p className="text-lg font-black text-blue-700">{toBn(viewUser.commentsCount || 0)}</p>
                  </div>
                  <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 text-center">
                    <p className="text-xs text-slate-500 font-bold">ফলোয়ার্স</p>
                    <p className="text-lg font-black text-purple-700">{toBn(viewUser.followersCount || 0)}</p>
                  </div>
                  <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 text-center">
                    <p className="text-xs text-slate-500 font-bold">ফ্ল্যাগড রিপোর্ট</p>
                    <p className="text-lg font-black text-rose-600">{toBn(viewUser.reportsReceivedCount || 0)}</p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-bold">ইমেইল:</span>
                    <span className="font-black text-slate-800">{viewUser.email || 'নাই'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-bold">ফোন নম্বর:</span>
                    <span className="font-black text-slate-800 font-mono">{viewUser.phone || 'নাই'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-bold">ঠিকানা (ইউনিয়ন ও গ্রাম):</span>
                    <span className="font-black text-slate-800">{viewUser.union || 'পুঠিয়া'}, {viewUser.village || 'গ্রামের নাম নাই'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-bold">NID ভেরিফিকেশন:</span>
                    <span className={`font-black ${viewUser.nidVerified ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {viewUser.nidVerified ? '✓ ভেরিফাইড NID' : 'অযাচাইকৃত'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-bold">যোগদানের তারিখ:</span>
                    <span className="font-black text-slate-800">
                      {viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleDateString('bn-BD') : 'অজানা'}
                    </span>
                  </div>
                  {viewUser.bio && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 font-bold">বায়ো (Bio):</span>
                      <p className="text-slate-700 italic mt-0.5">{viewUser.bio}</p>
                    </div>
                  )}
                </div>

                {/* Status Warning if Suspended/Banned */}
                {viewUser.statusReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle size={14} /> বর্তমান নিষেধাজ্ঞা / কারণ:
                    </p>
                    <p className="mt-0.5">{viewUser.statusReason}</p>
                  </div>
                )}

                {/* Quick Action Buttons in Modal */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleVerified(viewUser)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {viewUser.isVerified ? 'ভেরিফিকেশন সরান' : 'ব্লু ভেরিফাইড করুন'}
                  </button>

                  <button
                    onClick={() => handleToggleActive(viewUser)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {viewUser.status === 'active' ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                  </button>

                  {viewUser.status === 'suspended' ? (
                    <button
                      onClick={() => handleUnsuspend(viewUser)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      স্থগিতাদেশ প্রত্যাহার
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSuspendModalUser(viewUser);
                        setViewUser(null);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
                    >
                      স্থগিত (Suspend) করুন
                    </button>
                  )}

                  {viewUser.status === 'banned' || viewUser.isBlocked ? (
                    <button
                      onClick={() => handleUnban(viewUser)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      আনব্যান / আনব্লক
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setBanModalUser(viewUser);
                        setViewUser(null);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      ব্যান (Ban) করুন
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL 2: SUSPEND USER ----------------- */}
      <AnimatePresence>
        {suspendModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-700">
                <div className="p-3 bg-amber-100 rounded-2xl">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">ইউজার অ্যাকাউন্ট সাময়িক স্থগিত</h3>
                  <p className="text-xs text-slate-500">{suspendModalUser.name} (@{suspendModalUser.username})</p>
                </div>
              </div>

              <div className="space-y-3 text-xs font-bold text-slate-700">
                <div>
                  <label className="block mb-1 text-slate-500">স্থগিতের সময়কাল (দিন):</label>
                  <select
                    value={suspendDays}
                    onChange={(e) => setSuspendDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value={1}>১ দিন</option>
                    <option value={3}>৩ দিন</option>
                    <option value={7}>৭ দিন (১ সপ্তাহ)</option>
                    <option value={14}>১৪ দিন (২ সপ্তাহ)</option>
                    <option value={30}>৩০ দিন (১ মাস)</option>
                    <option value={90}>৯০ দিন (৩ মাস)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-500">স্থগিতের কারণ:</label>
                  <textarea
                    rows={3}
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-amber-500"
                    placeholder="স্থগিতের কারণ উল্লেখ করুন..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSuspendModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspend}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'প্রসেসিং...' : 'স্থগিত নিশ্চিত করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL 3: BAN USER ----------------- */}
      <AnimatePresence>
        {banModalUser && (
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
                  <h3 className="text-base font-black">ইউজার স্থায়ীভাবে ব্যান ও ব্লক</h3>
                  <p className="text-xs text-slate-500">{banModalUser.name} (@{banModalUser.username})</p>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                ব্যান করা হলে ইউজার আড্ডায় কোনো নতুন পোস্ট, কমেন্ট বা এক্সেস করতে পারবেন না।
              </p>

              <div className="text-xs font-bold text-slate-700">
                <label className="block mb-1 text-slate-500">ব্যান করার কারণ:</label>
                <textarea
                  rows={3}
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-rose-500"
                  placeholder="ব্যান করার কারণ উল্লেখ করুন..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBanModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBan}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'প্রসেসিং...' : 'ব্যান ও ব্লক করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL 4: ROLE CHANGE ----------------- */}
      <AnimatePresence>
        {roleModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-purple-700">
                <div className="p-3 bg-purple-100 rounded-2xl">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">ইউজার রোল ও পারমিশন পরিবর্তন</h3>
                  <p className="text-xs text-slate-500">{roleModalUser.name}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs font-bold text-slate-700">
                <label className="block text-slate-500">নতুন রোল নির্বাচন করুন:</label>
                {[
                  { role: 'user', label: 'নাগরিক ইউজার (General Citizen)', desc: 'সাধারণ সোশ্যাল ও ডিজিটাল সেবা এক্সেস' },
                  { role: 'editor', label: 'এডিটর / ক্রিয়েটর (Creator / Editor)', desc: 'মনিটাইজেশন ও কন্টেন্ট পাবলিশিং অগ্রাধিকার' },
                  { role: 'moderator', label: 'মডারেটর (Adda Moderator)', desc: 'পোস্ট ও কমেন্ট রিভিউ এবং ব্যান ক্ষমতা' },
                  { role: 'admin', label: 'এডমিন (System Admin)', desc: 'মডিউল ও সার্ভিস কনফিগারেশন কন্ট্রোল' },
                  { role: 'super_admin', label: 'সুপার এডমিন (Master Super Admin)', desc: 'পূর্ণাঙ্গ মাস্টার কমান্ড ও রোল ডিস্ট্রিবিউশন' },
                ].map((item) => (
                  <label
                    key={item.role}
                    onClick={() => setSelectedRole(item.role as any)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                      selectedRole === item.role 
                        ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-400' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="font-black text-slate-900">{item.label}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                    </div>
                    <input
                      type="radio"
                      name="role"
                      checked={selectedRole === item.role}
                      onChange={() => setSelectedRole(item.role as any)}
                      className="text-purple-600"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRoleChange}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'আপডেট হচ্ছে...' : 'রোল পরিবর্তন করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL 5: DELETE USER ----------------- */}
      <AnimatePresence>
        {deleteModalUser && (
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
                  <h3 className="text-base font-black">অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলুন</h3>
                  <p className="text-xs text-slate-500">{deleteModalUser.name}</p>
                </div>
              </div>

              <p className="text-xs text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-200">
                ⚠️ সতর্কবার্তা: এই ইউজারের সকল প্রোফাইল তথ্য ও একাউন্ট ডাটাবেজ থেকে মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফিরিয়ে আনা সম্ভব নয়।
              </p>

              <div className="text-xs font-bold text-slate-700">
                <label className="block mb-1 text-slate-500">নিশ্চিত করতে নিচে <strong>DELETE</strong> লিখুন:</label>
                <input
                  type="text"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={actionLoading || confirmDeleteText !== 'DELETE'}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'ডিলিট হচ্ছে...' : 'স্থায়ীভাবে ডিলিট করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AddaUserManagement;
